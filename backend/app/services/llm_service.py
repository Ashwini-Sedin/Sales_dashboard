import os
import json
import logging
from openai import OpenAI
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)

# GateLLM is accessible via the OpenAI SDK wrapper.
# Read config from environment variables.
api_key = os.getenv("GATELLM_API_KEY", "gatellm_live_3c567685e92e1bb013e79d5b860551e2a54759f6")
api_base = os.getenv("GATELLM_API_BASE", "https://gatellm.sedintechnologies.com/api")
model_name = os.getenv("GATELLM_MODEL", "gpt-4o-mini")

client = None
if api_key:
    client = OpenAI(
        api_key=api_key,
        base_url=api_base,
        timeout=8.0  # Prevent indefinite hangs on network reachability issues
    )

class QuickSalesLlmOutput(BaseModel):
    proposed_solution_name: str
    pricing_range: str
    key_benefits: List[str]
    client_challenges: List[str]
    introduction: str
    objective: str
    content_structure: str

async def generate_document_inputs(
    doc_type: str,
    client_name: str,
    client_company: str,
    proposed_solution: str,
    price_from: str,
    price_to: str,
    start_date: str,
    delivery_date: str,
    model: Optional[str] = None
) -> dict:
    """
    Call GateLLM to generate rich content for the document using the OpenAI SDK structure.
    """
    if not client:
        logger.warning("GateLLM client not initialized. Using fallback mock content.")
        return get_mock_fallback(doc_type, proposed_solution, price_from, price_to, start_date, delivery_date)

    selected_model = model or model_name or "gpt-4o-mini"
    prompt = f"""
    You are a professional business sales proposal writer.
    Generate standard sales proposal structure and professional note text based on these inputs:
    
    Document Type: {doc_type}
    Client Name: {client_name}
    Client Company: {client_company}
    Proposed Solution Name: {proposed_solution}
    Price Range: {price_from} to {price_to}
    Timeline: {start_date} to {delivery_date}

    Based on these details, please generate:
    1. A refined marketing name for the proposed solution.
    2. A readable pricing range summarizing the budget (e.g. "₹15,00,000 - ₹25,00,000").
    3. Exactly 3 to 5 clear business benefits of this solution (as a list).
    4. Exactly 2 to 3 key challenges that the client's company ({client_company}) likely faces which this solution addresses (as a list).
    5. A beautifully written "introduction" paragraph for a professional information note, introducing this engagement/proposal.
    6. An "objective" paragraph detailing the primary goals and benefits of this engagement.
    7. A "content_structure" paragraph describing the structured implementation phases and timeline.

    You MUST output this as a valid JSON object matching the following structure:
    {{
        "proposed_solution_name": "...",
        "pricing_range": "...",
        "key_benefits": ["...", "...", ...],
        "client_challenges": ["...", "...", ...],
        "introduction": "...",
        "objective": "...",
        "content_structure": "..."
    }}
    Do not include any markdown markup like ```json, just return the raw JSON string.
    """

    try:
        response = client.chat.completions.create(
            model=selected_model,
            messages=[
                {"role": "system", "content": "You are a helpful business assistant that outputs strictly raw JSON data matching the requested schema."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            timeout=8.0  # Set strict response timeout
        )
        
        content = response.choices[0].message.content.strip()
        # Strip code blocks if LLM accidentally included them
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        data = json.loads(content)
        # Populate timeline dates
        data["start_date"] = start_date
        data["end_date"] = delivery_date
        return data

    except Exception as e:
        logger.error(f"Error calling GateLLM API: {e}")
        return get_mock_fallback(doc_type, proposed_solution, price_from, price_to, start_date, delivery_date)

def get_mock_fallback(
    doc_type: str,
    proposed_solution: str,
    price_from: str,
    price_to: str,
    start_date: str,
    delivery_date: str
) -> dict:
    """Fallback generator in case the LLM API fails or is unconfigured."""
    sol_name = proposed_solution or "Cloud Enterprise Platform Upgrade"
    return {
        "proposed_solution_name": sol_name,
        "pricing_range": f"₹{price_from} - ₹{price_to}" if price_from and price_to else "₹15,00,000 - ₹25,00,000",
        "start_date": start_date or "01 May 2026",
        "end_date": delivery_date or "30 Sep 2026",
        "key_benefits": [
            "Seamless transition with absolute zero database downtime",
            "Enhanced auto-scaling supporting up to 10x concurrent users",
            "Up to 40% reduction in monthly cloud infrastructure overheads"
        ],
        "client_challenges": [
            "High maintenance overhead with legacy database clusters",
            "Severe page delays and slow queries under peak user traffic",
            "Inability to dynamically allocate computing power when needed"
        ],
        "introduction": f"This sample note serves as an exemplary format for crafting professional documentation for our upcoming {sol_name} engagement. In various professional settings, appropriate formatting and comprehensive information presentation are crucial for the clarity and efficiency of communication. Here, key elements and practices are encapsulated within a singular document to guide the creation of professional notes.",
        "objective": f"The primary objective of this {sol_name} note is to demonstrate the elements involved in producing a professional and informative document. These notes can serve many purposes, from formal business communications to records for personal use.",
        "content_structure": "A well-structured note includes an introduction that provides a brief overview of the document's purpose, followed by body paragraphs that detail the necessary information. Each segment should logically follow the next to ensure that the reader can easily understand the content without needing external references."
    }
