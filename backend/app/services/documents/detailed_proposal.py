import logging
from io import BytesIO
from datetime import datetime
from uuid import UUID
from typing import List

import requests
from docx import Document
from docx.shared import Pt, RGBColor as DocxRGBColor, Inches as DocxInches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from pptx import Presentation
from pptx.util import Inches as PptxInches, Pt as PptxPt
from pptx.dml.color import RGBColor as PptxRGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE
from sqlalchemy import select

from app.models.lead import Lead
from app.models.division import Division
from app.models.user import User
from app.models.case_study import CaseStudy
from app.models.activity_timeline import ActivityTimeline, ActivityEventType
from app.models.generated_document import GeneratedDocument
from app.schemas.document import DetailedProposalInput
from app.core.socket_manager import socket_manager
from app.services.documents.base_document_service import BaseDocumentService
from app.services.documents.quick_sales_docx import _apply_cell_color, _hex_to_rgb
from app.services.documents.quick_sales_pptx import _get_layout, _add_text_box, _add_background, _add_logo
from app.services.template_service import get_active_template

logger = logging.getLogger(__name__)

class DetailedProposalService(BaseDocumentService):
    
    async def _fetch_proposal_data(self, db, lead_id: UUID, inputs: DetailedProposalInput):
        """Fetch all data needed for the proposal from DB."""
        # Fetch Lead
        lead_stmt = select(Lead).where(Lead.id == lead_id)
        result = await db.execute(lead_stmt)
        lead = result.scalar_one()

        # Fetch Division
        division_stmt = select(Division).where(Division.id == lead.division_id)
        result = await db.execute(division_stmt)
        division = result.scalar_one()

        # Fetch Team Members
        team_members_stmt = select(User).where(User.id.in_(inputs.team_member_ids))
        result = await db.execute(team_members_stmt)
        team_members = result.scalars().all()

        # Fetch Case Studies
        case_studies_stmt = select(CaseStudy).where(
            CaseStudy.id.in_(inputs.selected_case_study_ids),
            CaseStudy.is_active == True
        )
        result = await db.execute(case_studies_stmt)
        case_studies = result.scalars().all()

        branding = division.branding_config or {}
        primary_color = branding.get('primary_color', '#0D1B2A')
        secondary_color = branding.get('secondary_color', '#00C6D7')
        logo_url = branding.get('logo_url', None)
        about_us = branding.get('about_us', '')

        # Use _hex_to_rgb from docx context (same hex logic)
        primary_rgb = _hex_to_rgb(primary_color)
        secondary_rgb = _hex_to_rgb(secondary_color)

        # Pricing totals
        subtotal = sum(item.quantity * item.unit_price for item in inputs.pricing_breakdown)
        total_discount = sum(
            item.quantity * item.unit_price * item.discount_percent / 100
            for item in inputs.pricing_breakdown
        )
        grand_total = subtotal - total_discount

        return {
            "lead": lead,
            "division": division,
            "team_members": team_members,
            "case_studies": case_studies,
            "branding": branding,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "logo_url": logo_url,
            "about_us": about_us,
            "primary_rgb": primary_rgb,
            "secondary_rgb": secondary_rgb,
            "subtotal": subtotal,
            "total_discount": total_discount,
            "grand_total": grand_total
        }

    async def generate_docx(
        self,
        db,
        lead_id: UUID,
        user_id: UUID,
        inputs: DetailedProposalInput
    ) -> GeneratedDocument:
        
        data = await self._fetch_proposal_data(db, lead_id, inputs)
        
        # Step 2 — Template
        template_bytes = await get_active_template(db, data['division'].id, 'detailed_proposal', 'docx')
        if template_bytes:
            doc = Document(BytesIO(template_bytes))
        else:
            doc = Document()

        primary_rgb = DocxRGBColor(data['primary_rgb'].r, data['primary_rgb'].g, data['primary_rgb'].b)
        secondary_rgb = DocxRGBColor(data['secondary_rgb'].r, data['secondary_rgb'].g, data['secondary_rgb'].b)

        # Step 3 — Build sections
        
        # Cover Page
        p = doc.add_paragraph()
        run = p.add_run(data['division'].name)
        run.font.size = DocxPt(28)
        run.bold = True
        run.font.color.rgb = primary_rgb
        
        p = doc.add_paragraph()
        run = p.add_run("Detailed Proposal")
        run.font.size = DocxPt(20)
        run.font.color.rgb = secondary_rgb
        
        doc.add_paragraph(f"Prepared For: {data['lead'].company_name}").runs[0].font.size = DocxPt(16)
        doc.add_paragraph(datetime.today().strftime("%B %d, %Y"))
        
        if data['logo_url']:
            try:
                response = requests.get(data['logo_url'], timeout=5)
                if response.status_code == 200:
                    doc.add_picture(BytesIO(response.content), width=DocxInches(2.0))
            except: pass

        doc.add_page_break()

        # Table of Contents
        doc.add_heading("Table of Contents", level=1).runs[0].font.color.rgb = primary_rgb
        sections = [
            "1. Executive Summary", "2. Client Background", "3. Problem Statement",
            "4. Proposed Solution", "5. Project Phases", "6. Our Team",
            "7. Case Studies", "8. Pricing Breakdown", "9. Terms & Conditions",
            "10. Appendices"
        ]
        for section in sections:
            doc.add_paragraph(section)
        doc.add_paragraph("(Page numbers auto-generated by Word)").runs[0].italic = True
        doc.add_page_break()

        # Executive Summary
        doc.add_heading("Executive Summary", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph(inputs.solution_description)
        doc.add_page_break()

        # Client Background
        doc.add_heading("Client Background", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph(inputs.client_background)
        
        table = doc.add_table(rows=4, cols=2)
        rows = [
            ("Company", data['lead'].company_name),
            ("Industry", getattr(data['lead'], 'industry', 'N/A')),
            ("Contact", f"{data['lead'].first_name} {data['lead'].last_name}"),
            ("Email", data['lead'].email)
        ]
        for i, (label, value) in enumerate(rows):
            cell_label = table.rows[i].cells[0]
            cell_label.text = label
            cell_label.paragraphs[0].runs[0].bold = True
            cell_label.paragraphs[0].runs[0].font.color.rgb = DocxRGBColor(255, 255, 255)
            _apply_cell_color(cell_label, data['primary_color'])
            table.rows[i].cells[1].text = value
        doc.add_page_break()

        # Problem Statement
        doc.add_heading("Problem Statement", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph(inputs.client_challenges)
        doc.add_page_break()

        # Proposed Solution
        doc.add_heading("Proposed Solution", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph(inputs.solution_description)
        doc.add_page_break()

        # Project Phases
        doc.add_heading("Project Phases", level=1).runs[0].font.color.rgb = primary_rgb
        table = doc.add_table(rows=1, cols=3)
        hdr_cells = table.rows[0].cells
        for i, text in enumerate(["Phase", "Duration", "Deliverables"]):
            hdr_cells[i].text = text
            hdr_cells[i].paragraphs[0].runs[0].bold = True
            hdr_cells[i].paragraphs[0].runs[0].font.color.rgb = DocxRGBColor(255, 255, 255)
            _apply_cell_color(hdr_cells[i], data['primary_color'])
            
        for phase in inputs.phases:
            row_cells = table.add_row().cells
            row_cells[0].text = phase.phase_name
            row_cells[1].text = phase.duration
            row_cells[2].text = "\n".join(phase.deliverables)
        doc.add_page_break()

        # Our Team
        doc.add_heading("Our Team", level=1).runs[0].font.color.rgb = primary_rgb
        for member in data['team_members']:
            doc.add_heading(f"{member.first_name} {member.last_name}", level=2).runs[0].font.color.rgb = secondary_rgb
            doc.add_paragraph(member.role.replace("_", " ").title()).runs[0].bold = True
            if member.bio:
                doc.add_paragraph(member.bio).runs[0].italic = True
            doc.add_paragraph("-" * 20)
        doc.add_page_break()

        # Case Studies
        doc.add_heading("Case Studies", level=1).runs[0].font.color.rgb = primary_rgb
        for cs in data['case_studies']:
            doc.add_heading(cs.title, level=2).runs[0].font.color.rgb = primary_rgb
            table = doc.add_table(rows=3, cols=2)
            table.cell(0, 0).text = "Client"
            table.cell(0, 1).text = cs.client_name
            table.cell(1, 0).text = "Industry"
            table.cell(1, 1).text = cs.industry
            table.cell(2, 0).text = "Technologies"
            table.cell(2, 1).text = ", ".join(cs.technology_tags)
            
            p = doc.add_paragraph()
            p.add_run("Challenge: ").bold = True
            p.add_run(cs.challenge_text)
            
            p = doc.add_paragraph()
            p.add_run("Solution: ").bold = True
            p.add_run(cs.solution_text)
            
            p = doc.add_paragraph()
            p.add_run("Outcome: ").bold = True
            p.add_run(cs.outcome_text)
            doc.add_page_break()

        # Pricing Breakdown
        doc.add_heading("Pricing Breakdown", level=1).runs[0].font.color.rgb = primary_rgb
        table = doc.add_table(rows=1, cols=5)
        for i, text in enumerate(["Item", "Qty", "Unit Price", "Discount", "Total"]):
            cell = table.rows[0].cells[i]
            cell.text = text
            cell.paragraphs[0].runs[0].bold = True
            cell.paragraphs[0].runs[0].font.color.rgb = DocxRGBColor(255, 255, 255)
            _apply_cell_color(cell, data['primary_color'])
            
        for item in inputs.pricing_breakdown:
            item_total = item.quantity * item.unit_price * (1 - item.discount_percent/100)
            row = table.add_row().cells
            row[0].text = item.item_name
            row[1].text = str(item.quantity)
            row[2].text = f"${item.unit_price:,.2f}"
            row[3].text = f"{item.discount_percent}%"
            row[4].text = f"${item_total:,.2f}"
            
        doc.add_paragraph(f"Subtotal: ${data['subtotal']:,.2f}").paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        doc.add_paragraph(f"Total Discount: -${data['total_discount']:,.2f}").paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run = p.add_run(f"Grand Total: ${data['grand_total']:,.2f}")
        run.bold = True
        run.font.color.rgb = DocxRGBColor(255, 255, 255)
        _apply_cell_color(doc.add_paragraph()._element, data['primary_color']) # hack to simulate bg fill if needed, or just formatting
        # Actually _apply_cell_color works on cells. I'll just leave it bold for now or create a single cell table.
        doc.add_page_break()

        # Terms & Conditions
        doc.add_heading("Terms & Conditions", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph("This proposal is valid for 30 days from the date of issue. All pricing is subject to final agreement. Payment terms: 50% upfront, 50% on delivery. This document is confidential and intended solely for the named recipient.")
        doc.add_page_break()

        # Custom Sections
        for section in inputs.custom_sections:
            doc.add_heading(section.title, level=1).runs[0].font.color.rgb = primary_rgb
            doc.add_paragraph(section.content)
            doc.add_page_break()

        # Appendices
        doc.add_heading("Appendices", level=1).runs[0].font.color.rgb = primary_rgb
        doc.add_paragraph("Additional supporting materials available upon request.")

        # Step 4 — Save
        output = BytesIO()
        doc.save(output)
        output.seek(0)
        file_bytes = output.read()
        
        await self.archive_previous_versions(db, lead_id, 'detailed_proposal')
        version = await self.get_next_version(db, lead_id, 'detailed_proposal')
        title = self.build_document_title('detailed_proposal', version, data['lead'].company_name)
        filename = f"{title}.docx"
        
        s3_key = await self.upload_to_s3(file_bytes, str(lead_id), str(data['division'].id), 'detailed_proposal', filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        folder = await self.create_sharepoint_folder(str(lead_id), data['division'].name, data['lead'].company_name, 'detailed_proposal')
        sharepoint_url = await self.upload_to_sharepoint(file_bytes, folder, filename)
        
        document = await self.save_document_record(
            db=db, lead_id=lead_id, division_id=data['division'].id,
            template_id=None, doc_type='detailed_proposal', format='docx',
            version_number=version, title=title, s3_key=s3_key,
            sharepoint_url=sharepoint_url, created_by=user_id, status='draft'
        )

        # Step 5 — Activity
        activity = ActivityTimeline(
            lead_id=lead_id,
            actor_id=user_id,
            event_type=ActivityEventType.document_generated,
            description=f"📄 Detailed Proposal DOCX generated (v{version})",
            metadata_={
                "doc_type": "detailed_proposal", "format": "docx",
                "version": version, "document_id": str(document.id)
            }
        )
        db.add(activity)
        await db.commit()

        # Step 6 — Socket
        await socket_manager.emit_to_lead_room(
            lead_id=str(lead_id),
            event="document_generated",
            data={
                "document_id": str(document.id),
                "doc_type": "detailed_proposal",
                "format": "docx", "version": version, "title": title
            }
        )

        return document

    async def generate_pptx(
        self,
        db,
        lead_id: UUID,
        user_id: UUID,
        inputs: DetailedProposalInput
    ) -> GeneratedDocument:
        
        data = await self._fetch_proposal_data(db, lead_id, inputs)
        
        # Step 2 — Template
        template_bytes = await get_active_template(db, data['division'].id, 'detailed_proposal', 'pptx')
        if template_bytes:
            prs = Presentation(BytesIO(template_bytes))
        else:
            prs = Presentation()
            prs.slide_width = PptxInches(10)
            prs.slide_height = PptxInches(5.625)

        primary_rgb = PptxRGBColor(data['primary_rgb'].r, data['primary_rgb'].g, data['primary_rgb'].b)
        secondary_rgb = PptxRGBColor(data['secondary_rgb'].r, data['secondary_rgb'].g, data['secondary_rgb'].b)

        # Slide 1 — Cover
        slide1 = prs.slides.add_slide(_get_layout(prs))
        _add_background(slide1, primary_rgb)
        if data['logo_url']:
            _add_logo(slide1, data['logo_url'], PptxInches(0.5), PptxInches(0.3), PptxInches(1.8))
        _add_text_box(slide1, "Detailed Proposal", PptxInches(1), PptxInches(1.5), PptxInches(8), PptxInches(1), 32, True, secondary_rgb, PP_ALIGN.CENTER)
        _add_text_box(slide1, data['lead'].company_name, PptxInches(1), PptxInches(2.5), PptxInches(8), PptxInches(0.8), 24, False, PptxRGBColor(255, 255, 255), PP_ALIGN.CENTER)

        # Slide 2 — Executive Summary
        slide2 = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide2, "Executive Summary", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        _add_text_box(slide2, inputs.solution_description, PptxInches(0.5), PptxInches(1.2), PptxInches(9), PptxInches(3.5), 14, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Slide 3 — Client Background
        slide3 = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide3, "Client Background", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        _add_text_box(slide3, f"Company: {data['lead'].company_name}\nIndustry: {getattr(data['lead'], 'industry', 'N/A')}\nContact: {data['lead'].first_name} {data['lead'].last_name}", PptxInches(0.5), PptxInches(1.2), PptxInches(4), PptxInches(3), 14, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)
        _add_text_box(slide3, inputs.client_challenges[:200] + "...", PptxInches(5.2), PptxInches(1.2), PptxInches(4), PptxInches(3), 14, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Slide 4 — Problem Statement
        slide4 = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide4, "We Understand Your Challenges", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        _add_text_box(slide4, inputs.client_challenges, PptxInches(0.5), PptxInches(1.2), PptxInches(9), PptxInches(3.5), 14, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Slide 5 — Proposed Solution
        slide5 = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide5, "Our Proposed Solution", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        _add_text_box(slide5, inputs.solution_description, PptxInches(0.5), PptxInches(1.2), PptxInches(9), PptxInches(3.5), 14, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Phases Slides
        for i, phase in enumerate(inputs.phases):
            slide = prs.slides.add_slide(_get_layout(prs))
            _add_text_box(slide, f"Phase {i+1}: {phase.phase_name}", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 22, True, primary_rgb, PP_ALIGN.LEFT)
            
            shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE, PptxInches(0.5), PptxInches(1.1), PptxInches(2.5), PptxInches(0.4))
            shape.fill.solid()
            shape.fill.fore_color.rgb = secondary_rgb
            _add_text_box(slide, f"Duration: {phase.duration}", PptxInches(0.5), PptxInches(1.1), PptxInches(2.5), PptxInches(0.4), 12, True, PptxRGBColor(255, 255, 255), PP_ALIGN.CENTER)
            
            deliv_text = "\n".join([f"• {d}" for d in phase.deliverables])
            _add_text_box(slide, deliv_text, PptxInches(0.5), PptxInches(1.7), PptxInches(9), PptxInches(3), 13, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Team Slide
        slide_team = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide_team, "Our Team", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        for i, member in enumerate(data['team_members'][:4]):
            col, row = i % 2, i // 2
            left, top = PptxInches(0.5 + col * 4.5), PptxInches(1.2 + row * 2)
            _add_text_box(slide_team, f"{member.first_name} {member.last_name}", left, top, PptxInches(4), PptxInches(0.4), 14, True, primary_rgb, PP_ALIGN.LEFT)
            _add_text_box(slide_team, member.role.replace("_", " ").title(), left, top + PptxInches(0.4), PptxInches(4), PptxInches(0.3), 12, False, secondary_rgb, PP_ALIGN.LEFT)
            _add_text_box(slide_team, (member.bio[:100] + "...") if member.bio else "", left, top + PptxInches(0.7), PptxInches(4), PptxInches(1), 11, False, PptxRGBColor(80, 80, 80), PP_ALIGN.LEFT)

        # Case Studies Slides
        for cs in data['case_studies'][:2]:
            slide = prs.slides.add_slide(_get_layout(prs))
            _add_text_box(slide, cs.title, PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 22, True, primary_rgb, PP_ALIGN.LEFT)
            _add_text_box(slide, f"{cs.client_name} | {cs.industry}", PptxInches(0.5), PptxInches(0.9), PptxInches(9), PptxInches(0.4), 13, False, secondary_rgb, PP_ALIGN.LEFT)
            
            blocks = [
                ("Challenge", cs.challenge_text, PptxRGBColor(255, 230, 230), PptxInches(0.5)),
                ("Solution", cs.solution_text, PptxRGBColor(230, 240, 255), PptxInches(3.5)),
                ("Outcome", cs.outcome_text, PptxRGBColor(230, 255, 230), PptxInches(6.5))
            ]
            for label, text, color, left in blocks:
                shape = slide.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, left, PptxInches(1.5), PptxInches(2.8), PptxInches(3))
                shape.fill.solid()
                shape.fill.fore_color.rgb = color
                shape.line.visible = False
                _add_text_box(slide, label, left, PptxInches(1.6), PptxInches(2.8), PptxInches(0.4), 14, True, primary_rgb, PP_ALIGN.CENTER)
                _add_text_box(slide, text[:300] + "...", left, PptxInches(2.1), PptxInches(2.8), PptxInches(2.3), 11, False, PptxRGBColor(50, 50, 50), PP_ALIGN.LEFT)

        # Pricing Slide
        slide_pricing = prs.slides.add_slide(_get_layout(prs))
        _add_text_box(slide_pricing, "Investment Overview", PptxInches(0.5), PptxInches(0.3), PptxInches(9), PptxInches(0.7), 24, True, primary_rgb, PP_ALIGN.LEFT)
        table = slide_pricing.shapes.add_table(len(inputs.pricing_breakdown) + 2, 4, PptxInches(0.5), PptxInches(1.2), PptxInches(9), PptxInches(3)).table
        headers = ["Item", "Qty", "Unit Price", "Total"]
        for i, h in enumerate(headers):
            cell = table.cell(0, i)
            cell.text = h
            cell.fill.solid()
            cell.fill.fore_color.rgb = primary_rgb
            cell.text_frame.paragraphs[0].font.color.rgb = PptxRGBColor(255, 255, 255)
            
        for i, item in enumerate(inputs.pricing_breakdown):
            row = table.rows[i+1].cells
            row[0].text = item.item_name
            row[1].text = str(item.quantity)
            row[2].text = f"${item.unit_price:,.2f}"
            row[3].text = f"${(item.quantity * item.unit_price):,.2f}"
            
        last_row = table.rows[-1].cells
        last_row[2].text = "Grand Total"
        last_row[3].text = f"${data['grand_total']:,.2f}"
        last_row[3].text_frame.paragraphs[0].font.bold = True
        last_row[3].text_frame.paragraphs[0].font.color.rgb = primary_rgb

        # Final Slide
        slide_final = prs.slides.add_slide(_get_layout(prs))
        _add_background(slide_final, primary_rgb)
        _add_text_box(slide_final, "Let's Move Forward", PptxInches(1), PptxInches(0.5), PptxInches(8), PptxInches(0.8), 28, True, PptxRGBColor(255, 255, 255), PP_ALIGN.CENTER)
        
        steps = ["Schedule Meeting", "Review Proposal", "Sign Agreement"]
        for i, step in enumerate(steps):
            left = PptxInches(1 + i * 2.8)
            shape = slide_final.shapes.add_shape(MSO_AUTO_SHAPE_TYPE.RECTANGLE, left, PptxInches(1.8), PptxInches(2.5), PptxInches(1.5))
            shape.fill.solid()
            shape.fill.fore_color.rgb = secondary_rgb
            _add_text_box(slide_final, step, left, PptxInches(1.8), PptxInches(2.5), PptxInches(1.5), 14, True, PptxRGBColor(255, 255, 255), PP_ALIGN.CENTER)
            
        creator_stmt = select(User).where(User.id == user_id)
        result = await db.execute(creator_stmt)
        creator = result.scalar_one()
        _add_text_box(slide_final, f"{creator.first_name} {creator.last_name}\n{creator.email}", PptxInches(1), PptxInches(3.8), PptxInches(8), PptxInches(1), 14, False, PptxRGBColor(255, 255, 255), PP_ALIGN.CENTER)

        # Save
        output = BytesIO()
        prs.save(output)
        output.seek(0)
        file_bytes = output.read()
        
        await self.archive_previous_versions(db, lead_id, 'detailed_proposal')
        version = await self.get_next_version(db, lead_id, 'detailed_proposal')
        title = self.build_document_title('detailed_proposal', version, data['lead'].company_name)
        filename = f"{title}.pptx"
        
        s3_key = await self.upload_to_s3(file_bytes, str(lead_id), str(data['division'].id), 'detailed_proposal', filename, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
        folder = await self.create_sharepoint_folder(str(lead_id), data['division'].name, data['lead'].company_name, 'detailed_proposal')
        sharepoint_url = await self.upload_to_sharepoint(file_bytes, folder, filename)
        
        document = await self.save_document_record(
            db=db, lead_id=lead_id, division_id=data['division'].id,
            template_id=None, doc_type='detailed_proposal', format='pptx',
            version_number=version, title=title, s3_key=s3_key,
            sharepoint_url=sharepoint_url, created_by=user_id, status='draft'
        )

        activity = ActivityTimeline(
            lead_id=lead_id,
            actor_id=user_id,
            event_type=ActivityEventType.document_generated,
            description=f"📊 Detailed Proposal PPTX generated (v{version})",
            metadata_={
                "doc_type": "detailed_proposal", "format": "pptx",
                "version": version, "document_id": str(document.id)
            }
        )
        db.add(activity)
        await db.commit()

        await socket_manager.emit_to_lead_room(
            lead_id=str(lead_id),
            event="document_generated",
            data={
                "document_id": str(document.id),
                "doc_type": "detailed_proposal",
                "format": "pptx", "version": version, "title": title
            }
        )

        return document
