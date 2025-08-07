import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import Chart from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [prices, setPrices] = useState([]);
  const [changePoints, setChangePoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pricesRes, changePointsRes, eventsRes] = await Promise.all([
          axios.get("http://127.0.0.1:5000/api/prices"),
          axios.get("http://127.0.0.1:5000/api/change-points"),
          axios.get("http://127.0.0.1:5000/api/events"),
        ]);
        setPrices(pricesRes.data);
        setChangePoints(changePointsRes.data);
        setEvents(eventsRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Data fetch failed:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatDate = (d) => new Date(d).toISOString().slice(0, 10);

  const filteredPrices = prices.filter(p => {
    const d = new Date(p.Date);
    return (!startDate || d >= startDate) && (!endDate || d <= endDate);
  });

  const labels = filteredPrices.map(p => formatDate(p.Date));
  const values = filteredPrices.map(p => p.Price);

  const changePointPrices = filteredPrices.map(p => {
    const date = formatDate(p.Date);
    return changePoints.find(cp => cp.change_point === date) ? p.Price : null;
  });

  const average =
    values.reduce((sum, val) => sum + val, 0) / (values.length || 1);
  const volatility = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
      (values.length || 1)
  );

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Brent Oil Price",
        data: values,
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.1)",
        fill: true,
        lineTension: 0.3,
      },
      {
        label: "Change Points",
        data: changePointPrices,
        borderColor: "red",
        backgroundColor: "red",
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: function (evt, activeElements) {
      if (activeElements.length > 0) {
        const index = activeElements[0]._index;
        const clickedDate = labels[index];
        const clickedPrice = values[index];
        alert(`Clicked Date: ${clickedDate}\nPrice: ${clickedPrice}`);
      }
    },
    scales: {
      xAxes: [
        {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 20,
          },
        },
      ],
    },
    legend: {
      position: "top",
    },
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Brent Oil Change Point Dashboard</h1>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div>
          <label>Start Date:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Start Date"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div>
          <label>End Date:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="End Date"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {loading ? (
        <p>Loading chart data...</p>
      ) : (
        <div style={{ height: "400px", marginTop: "2rem" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      <h2>Key Indicators</h2>
      <ul>
        <li><b>Average Price:</b> ${average.toFixed(2)}</li>
        <li><b>Volatility:</b> {volatility.toFixed(2)}</li>
        <li><b>Data Points:</b> {filteredPrices.length}</li>
      </ul>

      <h2>Detected Change Points</h2>
      <ul>
        {changePoints.map((cp, i) => (
          <li key={i}>
            <b>Change Point:</b> {cp.change_point}<br />
            <b>Event Date:</b> {cp.event_date}<br />
            <b>Description:</b> {cp.event_description}
          </li>
        ))}
      </ul>

      <h2>Event Timeline</h2>
      <ul>
        {events.map((e, i) => (
          <li key={i}>
            <b>{e.date}</b>: {e.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
