from datetime import datetime, timedelta, date
from app import create_app
from app.extensions import db
from app.models import (
    User,
    Category,
    Product,
    Customer,
    Supplier,
    Purchase,
    PurchaseItem,
    Sale,
    SaleItem,
    Order,
    OrderItem,
    Task,
    Attendance,
)

app = create_app()

with app.app_context():
    print("Seeding comprehensive data for CR Garments...")

    # 1. USERS
    users_data = [
        ("Super Admin", "admin@crgarments.com", "ADMIN", "admin123"),
        ("Manager Mike", "manager@crgarments.com", "MANAGER", "manager123"),
        ("Employee Emma", "employee@crgarments.com", "EMPLOYEE", "employee123"),
        ("Sales Associate Rahul", "rahul@crgarments.com", "EMPLOYEE", "rahul123"),
        ("Senior Cashier Priya", "priya@crgarments.com", "EMPLOYEE", "priya123"),
    ]
    user_map = {}
    for name, email, role, pwd in users_data:
        u = User.query.filter_by(email=email).first()
        if not u:
            u = User(name=name, email=email, role=role, status=True)
            u.set_password(pwd)
            db.session.add(u)
            db.session.flush()
            print(f"Created user: {email} ({role})")
        else:
            u.name = name
            u.role = role
            u.set_password(pwd)
        user_map[email] = u

    # 2. CATEGORIES
    cats_data = [
        "Men's Formal Wear",
        "Men's Casual & Denim",
        "Women's Ethnic & Festive",
        "Women's Western Wear",
        "Kids & Infant Wear",
        "Premium Accessories",
    ]
    cat_map = {}
    for cat_name in cats_data:
        c = Category.query.filter_by(name=cat_name).first()
        if not c:
            c = Category(name=cat_name, status=True)
            db.session.add(c)
            db.session.flush()
        cat_map[cat_name] = c

    # 3. SUPPLIERS
    suppliers_data = [
        (
            "Raymond Mills Mumbai",
            "Raymond Ltd",
            "022-28491020",
            "orders@raymond.in",
            "Worli Industrial Area, Mumbai",
            "27AAACR1234F1Z1",
        ),
        (
            "Arvind Textiles & Denims",
            "Arvind Lifestyle Ltd",
            "079-66382000",
            "sales@arvindmills.com",
            "Naroda Road, Ahmedabad",
            "24AAACA5678B1Z2",
        ),
        (
            "Vardhman Fabrics",
            "Vardhman Textiles Ltd",
            "0161-2222500",
            "supply@vardhman.com",
            "Chandigarh Road, Ludhiana",
            "03AAACV9012C1Z3",
        ),
        (
            "Surat Silk Consortium",
            "Surat Weavers Co",
            "0261-2490111",
            "contact@suratsilk.co",
            "Ring Road Textile Hub, Surat",
            "24AAACS3456D1Z4",
        ),
        (
            "Bombay Dyeing Mills",
            "Bombay Dyeing Ltd",
            "022-66620000",
            "info@bombaydyeing.com",
            "Dadar West, Mumbai",
            "27AAACB7890E1Z5",
        ),
    ]
    supplier_map = {}
    for name, company, phone, email, addr, gst in suppliers_data:
        s = Supplier.query.filter_by(email=email).first()
        if not s:
            s = Supplier(
                name=name,
                company=company,
                phone=phone,
                email=email,
                address=addr,
                gst_number=gst,
                status=True,
            )
            db.session.add(s)
            db.session.flush()
        supplier_map[email] = s

    # 4. PRODUCTS
    products_data = [
        (
            "CR-MF-01",
            "Royal Oxford Formal Shirt",
            "Men's Formal Wear",
            "Raymond",
            "100% Giza Cotton",
            "L",
            "Sky Blue",
            750.0,
            1499.0,
            42,
            10,
            "Tailored slim-fit breathable shirt crafted with imported Giza cotton.",
        ),
        (
            "CR-MC-02",
            "Classic Slim Fit Indigo Jeans",
            "Men's Casual & Denim",
            "Arvind Denims",
            "Stretch Denim 12oz",
            "32",
            "Deep Indigo",
            900.0,
            1899.0,
            28,
            10,
            "5-pocket mid-rise stretchable jeans with premium wash durability.",
        ),
        (
            "CR-WE-03",
            "Kanjivaram Pure Silk Saree",
            "Women's Ethnic & Festive",
            "Surat Silk",
            "Mulberry Silk & Zari",
            "Free",
            "Maroon & Gold",
            2800.0,
            5499.0,
            8,
            12,
            "Handwoven traditional bridal saree with rich zari border.",
        ),
        (
            "CR-WW-04",
            "Floral Print Summer Maxi Dress",
            "Women's Western Wear",
            "Vardhman",
            "Breathable Viscose",
            "M",
            "Pastel Floral",
            650.0,
            1299.0,
            35,
            10,
            "Flowy summer bohemian silhouette with smocked bodice.",
        ),
        (
            "CR-MF-05",
            "Navy Linen Tailored Blazer",
            "Men's Formal Wear",
            "Raymond",
            "Pure Irish Linen",
            "40",
            "Navy Blue",
            2100.0,
            4200.0,
            6,
            8,
            "Deconstructed lightweight blazer suitable for business and evening events.",
        ),
        (
            "CR-MC-06",
            "Heavyweight Pique Polo T-Shirt",
            "Men's Casual & Denim",
            "Bombay Dyeing",
            "Combed Pique Cotton",
            "XL",
            "Burgundy",
            380.0,
            799.0,
            64,
            15,
            "Ribbed collar regular fit polo with embroidered chest emblem.",
        ),
        (
            "CR-WE-07",
            "Chanderi Embroidered Kurta Set",
            "Women's Ethnic & Festive",
            "Surat Silk",
            "Chanderi Silk Blend",
            "L",
            "Emerald Green",
            1100.0,
            2399.0,
            18,
            10,
            "Intricately embroidered kurta with matching straight pants and organza dupatta.",
        ),
        (
            "CR-KD-08",
            "Organic Cotton Kids Dungaree Set",
            "Kids & Infant Wear",
            "Vardhman",
            "100% Organic Cotton",
            "4-5 Yrs",
            "Mustard & Navy",
            420.0,
            899.0,
            22,
            10,
            "Soft gentle organic cotton blend with adjustable shoulder straps.",
        ),
        (
            "CR-MC-09",
            "Vintage Washed Cargo Trousers",
            "Men's Casual & Denim",
            "Arvind Denims",
            "Cotton Twill 240 GSM",
            "34",
            "Olive Green",
            700.0,
            1599.0,
            30,
            10,
            "Relaxed utility cargos with reinforced double-stitch pockets.",
        ),
        (
            "CR-WW-10",
            "Oversized Boyfriend Denim Jacket",
            "Women's Western Wear",
            "Arvind Denims",
            "Rigid Cotton Denim",
            "M",
            "Vintage Stonewash",
            1200.0,
            2499.0,
            14,
            10,
            "Drop-shoulder relaxed jacket featuring distressed copper button detailing.",
        ),
        (
            "CR-FA-11",
            "Full-Grain Reversible Leather Belt",
            "Premium Accessories",
            "Raymond",
            "Genuine Buffalo Leather",
            "36",
            "Black / Tan",
            320.0,
            749.0,
            50,
            15,
            "Dual-sided reversible swivel buckle formal belt.",
        ),
        (
            "CR-KD-12",
            "Festive Sherwani Suit for Boys",
            "Kids & Infant Wear",
            "Surat Silk",
            "Raw Silk & Brocade",
            "6-7 Yrs",
            "Cream & Royal Blue",
            850.0,
            1799.0,
            4,
            8,
            "Festive royal sherwani with dhoti pants and contrast pocket square.",
        ),
        (
            "CR-MF-13",
            "Non-Iron French Cuff Dress Shirt",
            "Men's Formal Wear",
            "Raymond",
            "Wrinkle-Free Cotton",
            "M",
            "Crisp White",
            820.0,
            1699.0,
            25,
            10,
            "Luxurious wrinkle-resistant formal evening shirt with cutaway collar.",
        ),
        (
            "CR-WE-14",
            "Banarasi Georgette Floral Dupatta",
            "Women's Ethnic & Festive",
            "Surat Silk",
            "Pure Georgette",
            "Free",
            "Blush Pink",
            280.0,
            649.0,
            40,
            12,
            "Feather-light georgette dupatta accented with antique gold zari work.",
        ),
        (
            "CR-MC-15",
            "Supima Cotton Crewneck Pullover",
            "Men's Casual & Denim",
            "Bombay Dyeing",
            "100% Long Staple Supima",
            "L",
            "Charcoal Melange",
            490.0,
            1099.0,
            38,
            10,
            "Ultra-soft premium knit sweater designed for layering.",
        ),
        (
            "CR-WW-16",
            "High-Waist Pleated Office Skirt",
            "Women's Western Wear",
            "Vardhman",
            "Polyester Viscose Blend",
            "S",
            "Camel Tan",
            580.0,
            1249.0,
            19,
            10,
            "Sharply pleated midi pencil skirt with concealed back zip.",
        ),
    ]
    product_map = {}
    for (
        code,
        name,
        cat_name,
        brand,
        fabric,
        size,
        color,
        buy_p,
        sell_p,
        stock,
        min_s,
        desc,
    ) in products_data:
        p = Product.query.filter_by(product_code=code).first()
        cat = cat_map.get(cat_name)
        if not p:
            p = Product(
                product_code=code,
                name=name,
                category_id=cat.id if cat else 1,
                brand=brand,
                fabric=fabric,
                size=size,
                color=color,
                purchase_price=buy_p,
                selling_price=sell_p,
                stock_quantity=stock,
                min_stock=min_s,
                description=desc,
                status=True,
            )
            db.session.add(p)
            db.session.flush()
        else:
            p.name = name
            p.category_id = cat.id if cat else p.category_id
            p.brand = brand
            p.fabric = fabric
            p.size = size
            p.color = color
            p.purchase_price = buy_p
            p.selling_price = sell_p
            p.stock_quantity = stock
            p.min_stock = min_s
            p.description = desc
        product_map[code] = p

    # 5. CUSTOMERS
    customers_data = [
        (
            "Ananya Sharma",
            "9820112345",
            "ananya.sharma@gmail.com",
            "Flat 402, Green Glen Heights",
            "Bangalore",
            120,
            14200.0,
        ),
        (
            "Vikram Malhotra",
            "9819223456",
            "vikram.m@outlook.com",
            "14 Regency Park, Bandra West",
            "Mumbai",
            85,
            9800.0,
        ),
        (
            "Sneha Patel",
            "9723334567",
            "sneha.p@yahoo.com",
            "C-204 Shivalik Residency",
            "Ahmedabad",
            210,
            24500.0,
        ),
        (
            "Rajesh Kumar Verma",
            "9415445678",
            "rajesh.verma@tcs.com",
            "55 Civil Lines Road",
            "Lucknow",
            45,
            5200.0,
        ),
        (
            "Meera Reddy",
            "9940556789",
            "meera.reddy@gmail.com",
            "Plot 89 Jubilee Hills",
            "Hyderabad",
            160,
            18900.0,
        ),
        (
            "Kavita Sundaram",
            "9840667890",
            "kavita.s@gmail.com",
            "12 Poes Garden",
            "Chennai",
            95,
            11400.0,
        ),
        (
            "Arjun Kapoor",
            "9810778901",
            "arjun.k@techcorp.in",
            "D-18 Greater Kailash 1",
            "New Delhi",
            70,
            8300.0,
        ),
        (
            "Divya Nambiar",
            "9895889012",
            "divya.n@kerala.org",
            "Panampilly Nagar",
            "Kochi",
            130,
            15600.0,
        ),
    ]
    customer_map = {}
    for name, phone, email, addr, city, pts, total_p in customers_data:
        c = Customer.query.filter_by(phone=phone).first()
        if not c:
            c = Customer(
                name=name,
                phone=phone,
                email=email,
                address=addr,
                city=city,
                loyalty_points=pts,
                total_purchases=total_p,
            )
            db.session.add(c)
            db.session.flush()
        else:
            c.name = name
            c.email = email
            c.address = addr
            c.city = city
            c.loyalty_points = pts
            c.total_purchases = total_p
        customer_map[phone] = c

    # 6. SALES (Spread over the past 7 days for rich charts)
    now = datetime.utcnow()
    existing_sales = Sale.query.count()
    if existing_sales < 15:
        print("Generating historical sales data for past 7 days...")
        sales_schedule = [
            (6, "CR-MF-01", 2, "9820112345", "UPI"),
            (6, "CR-MC-06", 3, "9819223456", "CASH"),
            (5, "CR-WE-03", 1, "9723334567", "CARD"),
            (5, "CR-WW-04", 2, "9940556789", "UPI"),
            (4, "CR-MF-05", 1, "9810778901", "CARD"),
            (4, "CR-MC-02", 2, "9415445678", "CASH"),
            (3, "CR-WE-07", 2, "9840667890", "UPI"),
            (3, "CR-FA-11", 3, "9820112345", "CASH"),
            (2, "CR-WW-10", 1, "9895889012", "CARD"),
            (2, "CR-KD-08", 2, "9723334567", "UPI"),
            (1, "CR-MF-13", 2, "9819223456", "UPI"),
            (1, "CR-MC-15", 3, "9810778901", "CASH"),
            (0, "CR-MF-01", 3, "9820112345", "UPI"),
            (0, "CR-WE-03", 1, "9840667890", "CARD"),
            (0, "CR-MC-06", 4, "9940556789", "CASH"),
            (0, "CR-WW-04", 1, "9895889012", "UPI"),
        ]

        for days_ago, p_code, qty, cust_phone, pay_method in sales_schedule:
            prod = product_map.get(p_code)
            cust = customer_map.get(cust_phone)
            if not prod:
                continue

            sale_time = now - timedelta(days=days_ago, hours=3, minutes=15)
            subtotal = prod.selling_price * qty
            tax = round(subtotal * 0.05, 2)
            discount = 100.0 if subtotal > 2000 else 0.0
            grand_total = subtotal + tax - discount

            sale = Sale(
                customer_id=cust.id if cust else None,
                subtotal=subtotal,
                discount=discount,
                tax=tax,
                grand_total=grand_total,
                payment_method=pay_method,
                created_at=sale_time,
            )
            db.session.add(sale)
            db.session.flush()

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=prod.id,
                quantity=qty,
                price=prod.selling_price,
                total=subtotal,
            )
            db.session.add(sale_item)

    # 7. ORDERS
    existing_orders = Order.query.count()
    if existing_orders < 8:
        print("Creating sample customer orders...")
        orders_data = [
            (
                "9820112345",
                [("CR-MF-01", 2), ("CR-FA-11", 1)],
                "PAID",
                "Delivered",
                now - timedelta(days=3),
            ),
            (
                "9819223456",
                [("CR-MC-02", 1), ("CR-MC-06", 2)],
                "PAID",
                "Delivered",
                now - timedelta(days=2),
            ),
            (
                "9723334567",
                [("CR-WE-03", 1)],
                "PAID",
                "Processing",
                now - timedelta(days=1),
            ),
            (
                "9940556789",
                [("CR-WW-04", 2), ("CR-WW-10", 1)],
                "PENDING",
                "Pending",
                now - timedelta(hours=5),
            ),
            (
                "9840667890",
                [("CR-WE-07", 1), ("CR-WE-14", 2)],
                "PAID",
                "Ready",
                now - timedelta(hours=3),
            ),
            (
                "9810778901",
                [("CR-MF-05", 1), ("CR-MF-13", 1)],
                "PENDING",
                "Pending",
                now - timedelta(hours=1),
            ),
            (
                "9895889012",
                [("CR-KD-08", 2), ("CR-KD-12", 1)],
                "PAID",
                "Confirmed",
                now - timedelta(minutes=45),
            ),
        ]
        for cust_phone, items, pay_stat, ord_stat, ord_date in orders_data:
            cust = customer_map.get(cust_phone)
            total_amt = 0.0
            for p_code, q in items:
                p = product_map.get(p_code)
                if p:
                    total_amt += p.selling_price * q

            order = Order(
                customer_id=cust.id if cust else 1,
                total_amount=total_amt,
                payment_status=pay_stat,
                status=ord_stat,
                order_date=ord_date,
            )
            db.session.add(order)
            db.session.flush()

            for p_code, q in items:
                p = product_map.get(p_code)
                if p:
                    o_item = OrderItem(
                        order_id=order.id,
                        product_id=p.id,
                        quantity=q,
                        price=p.selling_price,
                        total=p.selling_price * q,
                    )
                    db.session.add(o_item)

    # 8. PURCHASES
    existing_purchases = Purchase.query.count()
    if existing_purchases < 5:
        print("Creating sample supplier purchases...")
        purchases_data = [
            (
                "orders@raymond.in",
                [("CR-MF-01", 50), ("CR-MF-05", 20)],
                "PAID",
                now - timedelta(days=12),
            ),
            (
                "sales@arvindmills.com",
                [("CR-MC-02", 40), ("CR-MC-09", 35)],
                "PAID",
                now - timedelta(days=9),
            ),
            (
                "contact@suratsilk.co",
                [("CR-WE-03", 15), ("CR-WE-07", 25)],
                "PAID",
                now - timedelta(days=6),
            ),
            (
                "supply@vardhman.com",
                [("CR-WW-04", 40), ("CR-KD-08", 30)],
                "PAID",
                now - timedelta(days=4),
            ),
            (
                "info@bombaydyeing.com",
                [("CR-MC-06", 70), ("CR-MC-15", 45)],
                "PAID",
                now - timedelta(days=2),
            ),
        ]
        for s_email, items, p_status, p_date in purchases_data:
            supp = supplier_map.get(s_email)
            if not supp:
                continue
            total_p_amt = 0.0
            for p_code, q in items:
                p = product_map.get(p_code)
                if p:
                    total_p_amt += p.purchase_price * q

            purchase = Purchase(
                supplier_id=supp.id,
                total_amount=total_p_amt,
                payment_status=p_status,
                created_at=p_date,
            )
            db.session.add(purchase)
            db.session.flush()

            for p_code, q in items:
                p = product_map.get(p_code)
                if p:
                    pi = PurchaseItem(
                        purchase_id=purchase.id,
                        product_id=p.id,
                        quantity=q,
                        purchase_price=p.purchase_price,
                        total=p.purchase_price * q,
                    )
                    db.session.add(pi)

    # 9. TASKS
    existing_tasks = Task.query.count()
    if existing_tasks < 6:
        print("Creating realistic operational tasks...")
        emma = user_map.get("employee@crgarments.com")
        rahul = user_map.get("rahul@crgarments.com")
        priya = user_map.get("priya@crgarments.com")
        mike = user_map.get("manager@crgarments.com")
        admin = user_map.get("admin@crgarments.com")

        tasks_data = [
            (
                "Physical inventory audit of Men's Autumn section",
                "Conduct a bar-code verified physical cycle count of shirts and blazers rack 3.",
                emma.id if emma else 3,
                mike.id if mike else 2,
                "Urgent",
                "In Progress",
                60,
                now + timedelta(days=1),
            ),
            (
                "Setup festive Diwali window display with Silk Sarees",
                "Arrange mannequins at the main entrance showcasing Kanjivaram and Chanderi sarees with thematic lighting.",
                rahul.id if rahul else 3,
                mike.id if mike else 2,
                "High",
                "In Progress",
                75,
                now + timedelta(days=2),
            ),
            (
                "Audit incoming fabric shipment batch #209 from Arvind Mills",
                "Inspect bolt quality, measure roll lengths, and verify dispatch invoice against PO-102.",
                priya.id if priya else 3,
                mike.id if mike else 2,
                "High",
                "Assigned",
                0,
                now + timedelta(days=3),
            ),
            (
                "Reconcile daily POS registers with bank UPI batch settlement",
                "Match electronic terminal batch slips with system gross sales total.",
                emma.id if emma else 3,
                mike.id if mike else 2,
                "Urgent",
                "In Progress",
                50,
                now + timedelta(hours=6),
            ),
            (
                "Apply barcode & price tags on new Pique Polo arrival",
                "Label all 70 units of CR-MC-06 and arrange them on shelf section B2.",
                rahul.id if rahul else 3,
                mike.id if mike else 2,
                "Medium",
                "Completed",
                100,
                now - timedelta(days=1),
            ),
            (
                "Prepare weekly sales tax & GST return reconciliation sheet",
                "Consolidate sales invoices, purchase inputs, and net credit calculations.",
                mike.id if mike else 2,
                admin.id if admin else 1,
                "High",
                "In Progress",
                40,
                now + timedelta(days=2),
            ),
            (
                "Restock low-inventory items: Italian Blazer & Kanjivaram Sarees",
                "Issue re-order request to Raymond and Surat Silk as stock is below min-level.",
                mike.id if mike else 2,
                admin.id if admin else 1,
                "Urgent",
                "Assigned",
                0,
                now + timedelta(days=1),
            ),
        ]

        for (
            title,
            desc,
            assigned_to,
            assigned_by,
            priority,
            status,
            prog,
            due,
        ) in tasks_data:
            t = Task(
                title=title,
                description=desc,
                assigned_to=assigned_to,
                assigned_by=assigned_by,
                priority=priority,
                status=status,
                progress=prog,
                due_date=due,
            )
            db.session.add(t)

    # 10. ATTENDANCE (For today & past 3 days)
    today_date = date.today()
    for user_key in [
        "employee@crgarments.com",
        "rahul@crgarments.com",
        "priya@crgarments.com",
        "manager@crgarments.com",
    ]:
        u = user_map.get(user_key)
        if not u:
            continue
        att_today = Attendance.query.filter_by(user_id=u.id, date=today_date).first()
        if not att_today:
            att_today = Attendance(
                user_id=u.id,
                date=today_date,
                status="PRESENT",
                tap_in=datetime.combine(today_date, datetime.min.time()).replace(
                    hour=9, minute=15
                ),
            )
            db.session.add(att_today)

    db.session.commit()
    print("ALL SEED DATA INSERTED AND COMMITTED SUCCESSFULLY!")
