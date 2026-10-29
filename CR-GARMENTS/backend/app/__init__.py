from flask import Flask
from app.config import Config
from app.extensions import db, cors, compress


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    compress.init_app(app)

    # Import models so they are registered
    with app.app_context():
        import app.models as _models
        _ = _models
        db.create_all()
        try:
            from app.models import User
            if not User.query.filter_by(email="admin@crgarments.com").first():
                admin = User(
                    name="Super Admin",
                    email="admin@crgarments.com",
                    role="ADMIN",
                    status=True
                )
                admin.set_password("admin123")
                db.session.add(admin)
                db.session.commit()
        except Exception as e:
            app.logger.warning(f"Initial admin setup skipped: {e}")

    # Register blueprints
    from app.routes.auth import bp as auth_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from app.routes.products import bp as products_bp

    app.register_blueprint(products_bp, url_prefix="/api/products")

    from app.routes.analytics import bp as analytics_bp

    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    from app.routes.categories import bp as categories_bp

    app.register_blueprint(categories_bp, url_prefix="/api/categories")

    from app.routes.sales import bp as sales_bp

    app.register_blueprint(sales_bp, url_prefix="/api/sales")

    from app.routes.suppliers import bp as suppliers_bp

    app.register_blueprint(suppliers_bp, url_prefix="/api/suppliers")

    from app.routes.purchases import bp as purchases_bp

    app.register_blueprint(purchases_bp, url_prefix="/api/purchases")

    from app.routes.customers import bp as customers_bp

    app.register_blueprint(customers_bp, url_prefix="/api/customers")

    from app.routes.attendance import bp as attendance_bp

    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")

    from app.routes.orders import bp as orders_bp

    app.register_blueprint(orders_bp, url_prefix="/api/orders")

    from app.routes.tasks import bp as tasks_bp

    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")

    @app.route("/api/health")
    def health_check():
        return {"status": "healthy", "message": "API is running"}

    return app
