from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.deal import Deal, DealStage, STAGE_PROBABILITY_MAP
from models.auth import User
from .auth_utils import get_current_user
from datetime import datetime
from sqlalchemy import extract, func

router = APIRouter(
	prefix="/forecast-revenue",
	tags=["Forecast Revenue"]
)

@router.get("/summary")
def get_forecast_revenue_summary(
	db: Session = Depends(get_db),
	current_user: User = Depends(get_current_user),
	range: str = "month"
):
	# Get all deals for the user's company
	deals = db.query(Deal).join(User, Deal.assigned_to == User.id)
	deals = deals.filter(User.related_to_company == current_user.related_to_company)
	deals = deals.filter(Deal.status != "Inactive")
	deals = deals.all()

	# Pipeline breakdown by stage
	pipeline = {}
	for stage in DealStage:
		stage_deals = [d for d in deals if d.stage == stage.value]
		expected = sum(float(d.amount or 0) for d in stage_deals)
		probability = STAGE_PROBABILITY_MAP[stage] / 100
		pipeline[stage.value] = {
			"expected": expected,
			"probability": probability,
			"weighted": expected * probability
		}

	# Weighted forecast
	weighted_forecast = sum(v["weighted"] for v in pipeline.values())

	# Actual and forecast revenue by month (for chart)
	# For demo: group by close_date month, sum amount for Closed Won
	actuals = db.query(
		extract('month', Deal.close_date).label('month'),
		func.sum(Deal.amount).label('revenue')
	).filter(
		Deal.stage == DealStage.CLOSED_WON.value,
		Deal.status != "Inactive",
		Deal.close_date != None,
		User.related_to_company == current_user.related_to_company
	).join(User, Deal.assigned_to == User.id)
	actuals = actuals.group_by('month').all()
	actuals_dict = {int(a.month): float(a.revenue) for a in actuals}

	# Forecast: deals not yet Closed Won, grouped by expected close month
	forecasts = db.query(
		extract('month', Deal.close_date).label('month'),
		func.sum(Deal.amount).label('revenue')
	).filter(
		Deal.stage != DealStage.CLOSED_WON.value,
		Deal.status != "Inactive",
		Deal.close_date != None,
		User.related_to_company == current_user.related_to_company
	).join(User, Deal.assigned_to == User.id)
	forecasts = forecasts.group_by('month').all()
	forecasts_dict = {int(f.month): float(f.revenue) for f in forecasts}

	return {
		"pipeline": pipeline,
		"weighted_forecast": weighted_forecast,
		"actuals": actuals_dict,
		"forecasts": forecasts_dict
	}
