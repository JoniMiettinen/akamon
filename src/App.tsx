import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataItem {
  timestamp: string;
  price: number;
  deliveryArea: string;
  unit: string;
}

const App: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [filteredData, setFilteredData] = useState<DataItem[]>([]);
  const [date, setDate] = useState<string>('');
  const [cheapestHour, setCheapestHour] = useState<string>('');
  const [mostExpensiveHour, setMostExpensiveHour] = useState<string>('');
  const [averagePrice, setAveragePrice] = useState<number>(0);
  const [cheapestPrice, setCheapestPrice] = useState<number>(0);
  const [mostExpensivePrice, setMostExpensivePrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  enum Unit {
    PricePerKWh = 'snt/kWh',
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DataItem[] = await response.json();
        const convertedData = data.map((item: DataItem) => ({
          ...item,
          price: item.price * 0.1 * 1.24,
          unit: Unit.PricePerKWh, // vältellään kirjotusvirheitä
        }));
        setData(convertedData);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || 'An unknown error occurred.');
        setData([]);
      }
    };
  
    fetchData();
  }, []);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  };

  const handleFilter = () => {
    const filtered = data.filter(item => item.timestamp.startsWith(date));
    setFilteredData(filtered);

    if (filtered.length > 0) {
      const cheapest = filtered.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
      const mostExpensive = filtered.reduce((prev, curr) => (prev.price > curr.price ? prev : curr));
      const average = filtered.reduce((sum, item) => sum + item.price, 0) / filtered.length;
      setCheapestHour(new Date(cheapest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setMostExpensiveHour(new Date(mostExpensive.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setAveragePrice(average);
      setCheapestPrice(cheapest.price);
      setMostExpensivePrice(mostExpensive.price);
    } else {
      setCheapestHour('');
      setMostExpensiveHour('');
      setAveragePrice(0);
      setCheapestPrice(0);
      setMostExpensivePrice(0);
    }
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
  };

  return (
    <div>
      <h1>Spot-Hinnat</h1>
      <input
        type="date"
        value={date}
        onChange={handleDateChange}
      />
      <button onClick={handleFilter}>Hae</button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch', marginBottom: '20px', padding: '10px', borderRadius: '5px', width: '100%' }}>
          <div style={{ flex: '0 1 200px', textAlign: 'center', margin: '0 10px', backgroundColor: 'lightgrey', padding: '10px', borderRadius: '5px', minHeight: '100px', justifyContent: 'center' }}>
            <p><strong>Halvin tunti {cheapestHour}</strong></p>
            <p>{cheapestPrice.toFixed(2)} snt/kWh</p>
          </div>
          <div style={{ flex: '0 1 200px', textAlign: 'center', margin: '0 10px', backgroundColor: 'lightgrey', padding: '10px', borderRadius: '5px', minHeight: '100px' }}>
            <p><strong>Kallein tunti {mostExpensiveHour}</strong></p>
            <p>{mostExpensivePrice.toFixed(2)} snt/kWh</p>
          </div>
          <div style={{ flex: '0 1 200px', textAlign: 'center', margin: '0 10px', backgroundColor: 'lightgrey', padding: '10px', borderRadius: '5px', minHeight: '100px' }}>
            <p><strong>Keskiarvo</strong></p>
            <p>{averagePrice.toFixed(2)} snt/kWh</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '30px', height: '15px', backgroundColor: 'rgba(246, 148, 148, 0.5)', border: '2px solid rgba(250, 90, 90, 0.5)', marginRight: '10px' }}>
          </div>
          <span>Hinnat snt/kWh</span>
        </div>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="90%" height={600}>
            <BarChart
              data={filteredData}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
              barCategoryGap="20%"
              barGap="2">
              <CartesianGrid strokeDasharray="0" />
              <XAxis dataKey="timestamp" tickFormatter={formatXAxis} tickCount={10} />
              <YAxis label={{ value: '', angle: -90, position: 'insideLeft' }} tickCount={10} />
              <Tooltip />
              {/* <Legend /> */}
              <Bar dataKey="price" fill="rgba(246, 148, 148, 0.5)" stroke="rgba(250, 90, 90, 0.5)" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>Ei tietoja tältä päivältä.</p>
        )}
      </div>
    </div>
  );
};

export default App;
