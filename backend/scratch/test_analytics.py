import os
import sys

# Ensure the backend directory is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Set up settings environment before importing app modules
os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require"
os.environ["SECRET_KEY"] = "your-super-secret-key-please-change"
os.environ["REDIS_URL"] = "rediss://default:gQAAAAAAAc70AAIgcDJlNDk4NTZiM2VmZjg0MmUwOWExMGQwM2I0NDc0ZTI3NA@bursting-chimp-118516.upstash.io:6379"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.reports import lead_reports

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)

def test():
    db = SessionLocal()
    try:
        print("Testing get_dashboard_stats...")
        stats = lead_reports.get_dashboard_stats(db)
        print("Stats success:", list(stats.keys()))

        print("\nTesting get_conversion_funnel...")
        funnel = lead_reports.get_conversion_funnel(db)
        print(f"Funnel success: {len(funnel)} rows")

        print("\nTesting get_salesperson_performance...")
        perf = lead_reports.get_salesperson_performance(db)
        print(f"Performance success: {len(perf)} rows")

        print("\nTesting get_monthly_trend...")
        trends = lead_reports.get_monthly_trend(db)
        print(f"Monthly trends success: {len(trends)} rows")

        print("\nTesting get_industry_breakdown...")
        ind = lead_reports.get_industry_breakdown(db)
        print(f"Industry breakdown success: {len(ind)} rows")

        print("\nTesting get_country_breakdown...")
        country = lead_reports.get_country_breakdown(db)
        print(f"Country breakdown success: {len(country)} rows")

        print("\nTesting get_source_revenue...")
        source = lead_reports.get_source_revenue(db)
        print(f"Source revenue success: {len(source)} rows")

        print("\nTesting get_top_companies...")
        comp = lead_reports.get_top_companies(db)
        print(f"Top companies success: {len(comp)} rows")

        print("\nTesting get_lead_score_distribution...")
        score = lead_reports.get_lead_score_distribution(db)
        print(f"Score distribution success: {len(score)} rows")

        print("\nTesting get_turnaround_report...")
        turnaround = lead_reports.get_turnaround_report(db)
        print(f"Turnaround success: {len(turnaround)} rows")

        print("\nTesting get_combined_analytics...")
        combined = lead_reports.get_combined_analytics(db)
        print("Combined analytics success:", list(combined.keys()))

        print("\nALL BACKEND ANALYTICS TESTS PASSED!")
    except Exception as e:
        print(f"\nCRITICAL BACKEND ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    test()
