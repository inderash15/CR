from app import create_app
from app.extensions import db
from app.models import User

app = create_app()

with app.app_context():
    # Check if admin already exists
    admin = User.query.filter_by(email='admin@crgarments.com').first()
    if not admin:
        admin = User(
            name='Super Admin',
            email='admin@crgarments.com',
            role='ADMIN'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully.")
    else:
        print("Admin user already exists.")
