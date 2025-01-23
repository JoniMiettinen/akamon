import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './styles.css';

interface DataItem {
  timestamp: string;
  price: number;
  deliveryArea: string;
  unit: string;
}

const Unit = {
  PricePerKWh: 'snt/kWh', // estää mahdolliset kirjoitusvirheet
};

const App: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [date, setDate] = useState<string>('');
  const [stats, setStats] = useState({
    cheapestHour: '',
    mostExpensiveHour: '',
    averagePrice: 0,
    cheapestPrice: 0,
    mostExpensivePrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('/data.json'); // haetaan data Json-tiedostosta fetch API:lla
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: DataItem[] = await response.json();
      const convertedData = result.map((item: DataItem) => ({
        ...item,
        price: item.price * 0.1 * 1.24, // muunnetaan €/MWh -> snt/kWh ja lisätään arvonlisävero
        unit: Unit.PricePerKWh,
      }));
      setData(convertedData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'An unknown error occurred.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // haetaan data aina kun pvm muuttuu
  useEffect(() => {
    if (date) {
      fetchData();
    }
  }, [date]);

  const filteredData = useMemo(() => {
    if (!date || !data.length) return [];
    return data.filter(item => item.timestamp.startsWith(date));
  }, [data, date]);

  // lasketaan halvin, kallein ja keskiarvo
  const calculateStats = useMemo(() => {
    if (filteredData.length > 0) {
      const cheapest = filteredData.reduce((prev, curr) => (prev.price < curr.price ? prev : curr));
      const mostExpensive = filteredData.reduce((prev, curr) => (prev.price > curr.price ? prev : curr));
      const average = filteredData.reduce((sum, item) => sum + item.price, 0) / filteredData.length;
      return {
        cheapestHour: new Date(cheapest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mostExpensiveHour: new Date(mostExpensive.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        averagePrice: average,
        cheapestPrice: cheapest.price,
        mostExpensivePrice: mostExpensive.price,
      };
    } else {
      return {
        cheapestHour: '',
        mostExpensiveHour: '',
        averagePrice: 0,
        cheapestPrice: 0,
        mostExpensivePrice: 0,
      };
    }
  }, [filteredData]);

  // päivitetään tilastot aina kun data muuttuu
  useEffect(() => {
    setStats(calculateStats);
  }, [calculateStats]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':'); // formatoidaan pvm, korvataan piste kaksoispisteellä
  };

  return (
    <div>
      <div style={{ width: '90%', margin: '0 auto', paddingLeft: '20px' }}>
        <h1>Akamon - spothinta ohjelmointitehtävä</h1>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          style={{ marginBottom: '20px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
        {loading ? <p>Loading...</p> : error ? <p>Error: {error}</p> : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch', marginBottom: '20px', padding: '10px', borderRadius: '5px', width: '100%' }}>
              <div className='statsBox'>
                <p><strong>Halvin tunti {stats.cheapestHour}</strong></p>
                <p>{stats.cheapestPrice.toFixed(2)} snt/kWh</p>
              </div>
              <div className='statsBox'>
                <p><strong>Kallein tunti {stats.mostExpensiveHour}</strong></p>
                <p>{stats.mostExpensivePrice.toFixed(2)} snt/kWh</p>
              </div>
              <div className='statsBox'>
                <p><strong>Keskiarvo</strong></p>
                <p>{stats.averagePrice.toFixed(2)} snt/kWh</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ width: '30px', height: '15px', backgroundColor: 'rgba(246, 148, 148, 0.5)', border: '2px solid rgba(250, 90, 90, 0.5)', marginRight: '10px' }} />
              <span>Hinnat snt/kWh</span>
            </div>
            <div>
              <h2>{date ? new Date(date).toLocaleDateString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : ''}
              </h2>
            </div>
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="90%" height={500}>
                <BarChart
                  data={filteredData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barCategoryGap="20%"
                  barGap="2"
                >
                  <CartesianGrid strokeDasharray="0" />
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} tickCount={10} />
                  <YAxis label={{ value: '', angle: -90, position: 'insideLeft' }} tickCount={10} />
                  <Bar dataKey="price" fill="rgba(246, 148, 148, 0.5)" stroke="rgba(250, 90, 90, 0.5)" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            ) : ''}
          </>
        )}
      </div>
    </div>
  );
};

export default App;