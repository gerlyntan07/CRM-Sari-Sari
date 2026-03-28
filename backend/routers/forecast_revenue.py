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
	range_param: str = "month"
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

	# Forecast: Use linear regression on actuals to predict next 3 months
	import numpy as np
	from datetime import date

	# Prepare data for regression: months (1-12) and actuals (fill 0 if missing)
	months = np.array(sorted(actuals_dict.keys()))
	actuals = np.array([actuals_dict[m] for m in months])


	forecasts_dict = {}
	if len(months) >= 2:
		# Fit y = a*x + b
		A = np.vstack([months, np.ones(len(months))]).T
		m, c = np.linalg.lstsq(A, actuals, rcond=None)[0]
		for i in range(1, 13):
			forecast = m * i + c
			forecasts_dict[i] = max(0, float(forecast))
	else:
		# Not enough data, fallback to open deals grouped by expected close month
		fallback = {i: 0.0 for i in range(1, 13)}
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
		for f in forecasts:
			fallback[int(f.month)] = float(f.revenue)
		forecasts_dict = fallback

	return {
		"pipeline": pipeline,
		"weighted_forecast": weighted_forecast,
		"actuals": actuals_dict,
		"forecasts": forecasts_dict
	}
