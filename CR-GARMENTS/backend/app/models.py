from app.extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class BaseModel(db.Model):
    __abstract__ = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class User(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="STAFF")  # ADMIN, MANAGER, STAFF
    status = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Category(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    products = db.relationship("Product", backref="category", lazy=True)


class Product(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    product_code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)
    brand = db.Column(db.String(100))
    fabric = db.Column(db.String(100))
    size = db.Column(db.String(50))
    color = db.Column(db.String(50))
    purchase_price = db.Column(db.Float, nullable=False)
    selling_price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    min_stock = db.Column(db.Integer, default=10)
    image = db.Column(db.String(255))
    description = db.Column(db.Text)
    status = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Supplier(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company = db.Column(db.String(150))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    gst_number = db.Column(db.String(50))
    status = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Purchase(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(50))  # PAID, PENDING, PARTIAL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("PurchaseItem", backref="purchase", lazy=True)
    supplier = db.relationship("Supplier", backref="purchases")


class PurchaseItem(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey("purchase.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    purchase_price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    product = db.relationship("Product")


class Customer(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    loyalty_points = db.Column(db.Integer, default=0)
    total_purchases = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Sale(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"))
    subtotal = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    grand_total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))  # CASH, UPI, CARD
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("SaleItem", backref="sale", lazy=True)
    customer = db.relationship("Customer", backref="sales")


class SaleItem(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    product = db.relationship("Product")


class Order(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer, db.ForeignKey("customer.id"), nullable=False, index=True
    )
    total_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(50), index=True)  # PAID, PENDING
    status = db.Column(
        db.String(50), default="Pending", index=True
    )  # Pending, Confirmed, Processing, Ready, Delivered, Cancelled
    order_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    delivery_date = db.Column(db.DateTime)
    items = db.relationship("OrderItem", backref="order", lazy=True)
    customer = db.relationship("Customer", backref="orders")


class OrderItem(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    product = db.relationship("Product")


class Return(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=True)
    reason = db.Column(db.Text)
    refund_type = db.Column(db.String(50))  # REFUND, EXCHANGE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("ReturnItem", backref="return_record", lazy=True)


class ReturnItem(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey("return.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    product = db.relationship("Product")


class Expense(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Payment(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    reference_type = db.Column(db.String(50))  # SALE, PURCHASE, ORDER
    reference_id = db.Column(db.Integer)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50))
    status = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class StockMovement(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    movement_type = db.Column(db.String(50))  # PURCHASE, SALE, RETURN, ADJUSTMENT
    previous_stock = db.Column(db.Integer, nullable=False)
    new_stock = db.Column(db.Integer, nullable=False)
    reference = db.Column(db.String(100))
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ActivityLog(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    action = db.Column(db.String(255), nullable=False)
    module = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User")


class Attendance(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="PRESENT")  # PRESENT, ABSENT, LEAVE
    tap_in = db.Column(db.DateTime)
    tap_out = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship("User", backref="attendance_records")


class Task(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    priority = db.Column(db.String(20), default="Medium")  # Low, Medium, High, Urgent
    status = db.Column(
        db.String(20), default="Assigned"
    )  # Assigned, In Progress, Completed, Overdue, Cancelled
    progress = db.Column(db.Integer, default=0)  # 0 to 100
    due_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignee = db.relationship(
        "User", foreign_keys=[assigned_to], backref="tasks_assigned_to"
    )
    assigner = db.relationship(
        "User", foreign_keys=[assigned_by], backref="tasks_assigned_by"
    )
    comments = db.relationship("TaskComment", backref="task", lazy=True)


class TaskComment(BaseModel):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User")
