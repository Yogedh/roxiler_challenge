import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [totalSaleAmount, setTotalSaleAmount] = useState(0);
  const [totalSoldItems, setTotalSoldItems] = useState(0);
  const [totalNotSoldItems, setTotalNotSoldItems] = useState(0);
  const [barChartData, setBarChartData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('March');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
    fetchStatistics();
    fetchBarChartData();
  }, [selectedMonth, searchText, currentPage]); // Update data when selectedMonth, searchText, or currentPage changes

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/transactions?month=${selectedMonth}&searchText=${searchText}&page=${currentPage}&perPage=${perPage}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`/api/statistics?month=${selectedMonth}`);
      setTotalSaleAmount(response.data.totalSaleAmount);
      setTotalSoldItems(response.data.totalSoldItems);
      setTotalNotSoldItems(response.data.totalNotSoldItems);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchBarChartData = async () => {
    try {
      const response = await axios.get(`/api/bar-chart?month=${selectedMonth}`);
      setBarChartData(response.data);
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleSearch = (event) => {
    setSearchText(event.target.value);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="App">
      <h1>Transactions Table</h1>
      <select value={selectedMonth} onChange={handleMonthChange}>
        <option value="January">January</option>
        <option value="February">February</option>
        <option value="March">March</option>
        {/* Add other months */}
      </select>
      <input type="text" value={searchText} onChange={handleSearch} placeholder="Search transactions..." />
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            {/* Add other columns */}
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction._id}>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>{transaction.price}</td>
              {/* Add other columns */}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePreviousPage}>Previous</button>
      <button onClick={handleNextPage}>Next</button>

      <h1>Transactions Statistics</h1>
      <div>Total Sale Amount: {totalSaleAmount}</div>
      <div>Total Sold Items: {totalSoldItems}</div>
      <div>Total Not Sold Items: {totalNotSoldItems}</div>

      <h1>Transactions Bar Chart</h1>
      <div>
        {/* Display bar chart using barChartData */}
      </div>
    </div>
  );
}

export default App;
