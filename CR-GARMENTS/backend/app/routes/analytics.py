from flask import Blueprint, jsonify
from app.models import (
    Product,
    Customer,
    Supplier,
    Order,
    Sale,
    SaleItem,
    Task,
    Attendance,
    User,
)
from app.extensions import db
from app.middleware.auth import token_required
from sqlalchemy import func
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

bp = Blueprint("analytics", __name__)


@bp.route("/dashboard-stats", methods=["GET"])
@token_required
def get_dashboard_stats(current_user):
    try:
        today = datetime.utcnow().date()

        if current_user.role == "EMPLOYEE":
            # Employee Specific Stats
            today_sales_query = (
                db.session.query(func.sum(Sale.grand_total))
                .filter(func.date(Sale.created_at) == today)
                .scalar()
            )
            today_sales_count = Sale.query.filter(
                func.date(Sale.created_at) == today
            ).count()

            recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
            recent_sales_data = [
                {
                    "invoice": f"INV-{s.id}",
                    "amount": s.grand_total,
                    "time": s.created_at.strftime("%H:%M"),
                    "status": "Completed",
                }
                for s in recent_sales
            ]

            return jsonify(
                {
                    "success": True,
                    "data": {
                        "role": "EMPLOYEE",
                        "my_sales": today_sales_count,
                        "my_sales_amount": today_sales_query or 0.0,
                        "my_orders": Order.query.filter_by(status="Pending").count(),
                        "recent_sales": recent_sales_data,
                    },
                }
            )

        else:
            # Manager / Admin Stats
            total_products = Product.query.count()
            total_customers = Customer.query.count()
            total_suppliers = Supplier.query.count()

            low_stock_items = Product.query.filter(
                Product.stock_quantity <= Product.min_stock
            ).all()

            today_sales_query = (
                db.session.query(func.sum(Sale.grand_total))
                .filter(func.date(Sale.created_at) == today)
                .scalar()
            )
            today_sales = float(today_sales_query) if today_sales_query else 0.0
            today_orders = Sale.query.filter(
                func.date(Sale.created_at) == today
            ).count()

            pending_orders_list = Order.query.filter_by(status="Pending").all()

            # Tasks logic for Manager/Admin
            if current_user.role == "ADMIN":
                all_tasks = Task.query.all()
            else:
                all_tasks = (
                    Task.query.join(User, Task.assigned_to == User.id)
                    .filter(User.role != "ADMIN")
                    .all()
                )

            overdue_tasks = [
                t
                for t in all_tasks
                if t.status != "Completed" and t.due_date and t.due_date.date() < today
            ]
            completed_tasks = [t for t in all_tasks if t.status == "Completed"]
            pending_tasks = [t for t in all_tasks if t.status != "Completed"]

            # Attendance logic for Manager/Admin
            all_employees = User.query.filter(User.role != "ADMIN").all()
            todays_attendance = Attendance.query.filter(Attendance.date == today).all()
            present_users = [
                a.user_id for a in todays_attendance if a.status == "PRESENT"
            ]
            absent_count = max(0, len(all_employees) - len(present_users))

            # Weekly Sales Trend Data (Past 7 days)
            chart_data = []
            for i in range(6, -1, -1):
                day_date = today - timedelta(days=i)
                day_sales_query = (
                    db.session.query(func.sum(Sale.grand_total))
                    .filter(func.date(Sale.created_at) == day_date)
                    .scalar()
                )

                chart_data.append(
                    {
                        "name": day_date.strftime("%a"),
                        "sales": float(day_sales_query) if day_sales_query else 0.0,
                    }
                )

            # Admin Specific Stats
            total_inventory_value = 0.0
            top_products_list = []
            if current_user.role == "ADMIN":
                all_products = Product.query.all()
                total_inventory_value = sum(
                    (p.stock_quantity or 0) * (p.purchase_price or 0.0)
                    for p in all_products
                )

                # Query top 5 selling products
                top_selling = (
                    db.session.query(
                        SaleItem.product_id,
                        func.sum(SaleItem.quantity).label("total_sold"),
                    )
                    .group_by(SaleItem.product_id)
                    .order_by(db.desc("total_sold"))
                    .limit(5)
                    .all()
                )

                for product_id, total_sold in top_selling:
                    p = db.session.get(Product, product_id)
                    if p:
                        top_products_list.append(
                            {
                                "id": p.id,
                                "name": p.name,
                                "sold": int(total_sold),
                                "revenue": float(total_sold * p.selling_price),
                            }
                        )

            return jsonify(
                {
                    "success": True,
                    "data": {
                        "role": current_user.role,
                        "total_products": total_products,
                        "total_customers": total_customers,
                        "total_suppliers": total_suppliers,
                        "today_sales": today_sales,
                        "today_orders": today_orders,
                        "chart_data": chart_data,
                        "low_stock_count": len(low_stock_items),
                        "low_stock_items": [
                            {"id": p.id, "name": p.name, "stock": p.stock_quantity}
                            for p in low_stock_items[:5]
                        ],
                        "pending_orders": len(pending_orders_list),
                        "pending_orders_list": [
                            {
                                "id": o.id,
                                "amount": o.total_amount,
                                "customer": o.customer.name if o.customer else "Guest",
                            }
                            for o in pending_orders_list[:5]
                        ],
                        "overdue_tasks_count": len(overdue_tasks),
                        "overdue_tasks": [
                            {
                                "id": t.id,
                                "title": t.title,
                                "assignee": (
                                    t.assignee.name if t.assignee else "Unassigned"
                                ),
                            }
                            for t in overdue_tasks[:5]
                        ],
                        "tasks_completed": len(completed_tasks),
                        "tasks_pending": len(pending_tasks),
                        "employees_present": len(present_users),
                        "employees_absent": absent_count,
                        "total_inventory_value": total_inventory_value,
                        "top_products": top_products_list,
                    },
                }
            )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@bp.route("/predict-demand/<int:product_id>", methods=["GET"])
@token_required
def predict_demand(current_user, product_id):
    try:
        sales = (
            db.session.query(
                func.date(Sale.created_at).label("date"),
                func.sum(SaleItem.quantity).label("total_qty"),
            )
            .join(SaleItem, Sale.id == SaleItem.sale_id)
            .filter(SaleItem.product_id == product_id)
            .group_by(func.date(Sale.created_at))
            .order_by(func.date(Sale.created_at))
            .all()
        )

        if len(sales) < 5:
            return jsonify(
                {
                    "success": False,
                    "message": "Not enough historical data to generate a prediction.",
                }
            )

        df = pd.DataFrame(sales, columns=["date", "qty"])
        df["date"] = pd.to_datetime(df["date"])
        df["date_ordinal"] = df["date"].map(pd.Timestamp.toordinal)

        X = df[["date_ordinal"]]
        y = df["qty"]

        model = LinearRegression()
        model.fit(X, y)

        future_dates = [df["date"].max() + pd.Timedelta(days=i) for i in range(1, 8)]
        future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)

        predictions = model.predict(future_ordinals)
        predicted_demand = max(0, int(sum(predictions)))

        product = db.session.get(Product, product_id)
        if not product:
            return jsonify({"success": False, "message": "Product not found"}), 404

        suggested_stock = predicted_demand + product.min_stock

        return jsonify(
            {
                "success": True,
                "data": {
                    "product_name": product.name,
                    "historical_sales_days": len(sales),
                    "predicted_demand_next_7_days": predicted_demand,
                    "suggested_stock_level": suggested_stock,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
