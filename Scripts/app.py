from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask is running!"


# Load data
prices_df = pd.read_csv('Data/BrentOilPrices.csv')
prices_df['Date'] = pd.to_datetime(prices_df['Date'],format="mixed")

events_df = pd.read_csv('brent_oil_price_events.csv')
events_df['date'] = pd.to_datetime(events_df['date'],format="mixed")

cpdf = pd.read_csv('cp_dates.csv')
cpdf['Change_dates'] = pd.to_datetime(cpdf['Change_dates'])

@app.route('/api/prices')
def get_prices():
    data = prices_df.to_dict(orient='records')
    return jsonify(data)

@app.route('/api/events')
def get_events():
    data = events_df.to_dict(orient='records')
    return jsonify(data)


def match_events(change_dates, events_df, max_days=180):
    matched = []

    for cp_date in change_dates:
        nearby = events_df[
            (events_df['date'] >= cp_date - pd.Timedelta(days=max_days)) &
            (events_df['date'] <= cp_date + pd.Timedelta(days=max_days))
        ]

        if not nearby.empty:
            event = nearby.iloc[0]
            matched.append({
                'change_point': cp_date.strftime('%Y-%m-%d'),
                'event_date': event['date'].strftime('%Y-%m-%d'),
                'event_description': event['description']})
        else:
            matched.append({
                'change_point': cp_date.strftime('%Y-%m-%d'),
                'event_date': None,
                'event_description': "No matching event found"})

    return matched

@app.route('/api/change-points')
def get_change_points_with_events():
    matched_data = match_events(cpdf['Change_dates'], events_df)
    return jsonify(matched_data)

if __name__ == '__main__':
    app.run(debug=True)

