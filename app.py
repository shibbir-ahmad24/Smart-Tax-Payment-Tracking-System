from flask import Flask, request, redirect, render_template, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
import os

app = Flask(__name__)
app.debug = True

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///TaxTracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)
    
class TaxPayment(db.Model):
    t_id = db.Column(db.Integer, primary_key=True, index=True, autoincrement=True)
    company_name = db.Column('company', db.String(100), nullable=False)
    amount_no = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(100), nullable=False)
    payment_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=False)

    @property
    def company(self):
        return self.company_name

    @company.setter
    def company(self, value):
        self.company_name = value.upper()

@app.route('/')
def index():
    records = TaxPayment.query.all()
    return render_template('index.html', records=records)

@app.route('/fetchTaxRecords/<dueDate>')
def fetchTaxRecords(dueDate):
    if dueDate == 'all':
        records = TaxPayment.query.all()
    else:
        due_date_obj = datetime.strptime(dueDate, '%Y-%m-%d').date()
        records = TaxPayment.query.filter(TaxPayment.due_date == due_date_obj)

    json_records = []
    for record in records:
        json_record = {
            't_id': record.t_id,
            'company_name': record.company_name,
            'amount_no': record.amount_no,
            'payment_date': record.payment_date.strftime('%Y-%m-%d') if record.payment_date else None,
            'status': record.status,
            'due_date': record.due_date.strftime('%Y-%m-%d')
        }
        json_records.append(json_record)

    return jsonify(json_records)

@app.route('/insert-record', methods=['POST'])
def insert_record():
    company = request.form.get('company')
    amount_no_str = request.form.get('amount_no')
    
    if amount_no_str is not None and amount_no_str.strip():
        try:
            amount_no = float(amount_no_str)
        except ValueError:
            return "Invalid amount provided", 400
    else:
        return "Amount is required", 400
    
    payment_date_str = request.form.get('payment_date')
    payment_date = datetime.strptime(payment_date_str, '%Y-%m-%d') if payment_date_str else None
    status = request.form.get('status')
    due_date = datetime.strptime(request.form.get('due_date'), '%Y-%m-%d')
    
    new_record = TaxPayment(company=company, amount_no=amount_no, payment_date=payment_date, status=status, due_date=due_date)
    db.session.add(new_record)
    db.session.commit()
    return redirect(url_for('index'))


@app.route('/update/<int:t_id>', methods=['POST'])
def update_record(t_id):
    record = TaxPayment.query.get_or_404(t_id)
    record.company = request.form.get('company')
    record.amount_no = float(request.form.get('amount_no'))
    record.payment_date = datetime.strptime(request.form.get('payment_date'), '%Y-%m-%d')
    record.status = request.form.get('status')
    record.due_date = datetime.strptime(request.form.get('due_date'), '%Y-%m-%d')
    db.session.commit()
    return redirect(url_for('index'))


@app.route('/delete/<int:t_id>', methods=['POST'])
def delete_record(t_id):
    record = TaxPayment.query.get_or_404(t_id)
    db.session.delete(record)
    db.session.commit()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run()
