import './App.css';
import { useState, useEffect } from 'react';

const uri = "http://localhost:3000/api/student/booked-key";
const registerUri = "http://localhost:3000/api/student/register";

// KeyInfoBox Component for displaying individual counts
const KeyInfoBox = ({ title, count, colSpan = 1 }) => (
  <div className={`bg-white p-4 shadow-md rounded-md border border-gray-200 ${colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
    <p className="font-serif text-xl font-semibold text-gray-700">{title}</p>
    <p className="flex justify-center h-1/3 text-2xl font-bold text-gray-900 text-center items-center">{count}</p>
  </div>
);

function App() {
  const [rfId, setRfId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeForm, setActiveForm] = useState('register'); // State to handle form toggle

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/student/stack');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // If loading or error occurs
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Count based on conditions
  const availableKeys = data.filter(student => student.keyStatus === 'Available').length;
  const takenKeys = data.filter(student => student.keyStatus === 'Taken').length;
  const bannedStudents = data.filter(student => student.studentBannedStatus).length;
  const totalWarnings = data.reduce((sum, student) => sum + student.studentWarningStatus, 0);

  // Submit RFID and Book Key
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous message

    try {
      const response = await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rfId })
      });
      const result = await response.json();

      if (response.ok) {
        setMessage(`Success: ${result.message}`);
        if (result.code === "Camera activated") {
          const userInput = prompt("Please enter key number");
          if (userInput) {
            const keyResponse = await fetch(uri, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: rfId, key: userInput })
            });
            const keyResult = await keyResponse.json();
            setMessage(keyResponse.ok ? `Success: ${keyResult.message}` : `Error: ${keyResult.message || 'Unable to open camera'}`);
          }
        }
      } else {
        setMessage(`Error: ${result.message || 'Unable to book key'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setRfId(''); // Clear input field
    }
  };

  // Register a new student
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMessage(''); // Clear previous message

    // Validation to check that all required fields are filled
    if (!rfId || !studentId || !studentName) {
      setRegisterMessage("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(registerUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfId, studentId, name: studentName })
      });
      const result = await response.json();

      if (response.ok) {
        setRegisterMessage(`Success: Student ${studentName} registered successfully!`);
      } else {
        setRegisterMessage(`Error: ${result.message || 'Unable to register student'}`);
      }
    } catch (error) {
      setRegisterMessage(`Error: ${error.message}`);
    } finally {
      // Clear input fields after submission
      setStudentName('');
      setRfId('');
      setStudentId('');
    }
  };

  return (
    <div className="bg-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 h-screen p-6">
      {/* Existing Key Info Boxes */}
      <KeyInfoBox title="Available Keys" count={availableKeys} colSpan={2} />
      <KeyInfoBox title="Taken Keys" count={takenKeys} colSpan={2} />
      <KeyInfoBox title="Issued Warnings" count={totalWarnings} />
      <KeyInfoBox title="Banned Students" count={bannedStudents} />

      {/* Toggle Button for Forms */}
      <div className="col-span-4 bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveForm('register')}
            className={`py-2 px-4 rounded-md ${activeForm === 'register' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Register Student
          </button>
          <button
            onClick={() => setActiveForm('find')}
            className={`py-2 px-4 rounded-md ${activeForm === 'find' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Find Student
          </button>
          <button
            onClick={() => setActiveForm('key')}
            className={`py-2 px-4 rounded-md ${activeForm === 'key' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Add New Key
          </button>
        </div>

        {/* Form to Register a New Student */}
        {activeForm === 'register' && (
          <div className="bg-white p-6 rounded-lg col-span-2">
            <form onSubmit={handleRegister}>
              <p className="font-serif text-sm text-gray-600 mb-2">Register a New Student</p>
              <input
                type="text"
                className="p-3 rounded-md w-full mb-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter Student Name"
                required
              />
              <input
                type="text"
                className="p-3 rounded-md w-full mb-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID"
                required
              />
              <input
                type="text"
                className="p-3 rounded-md w-full mb-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={rfId}
                onChange={(e) => setRfId(e.target.value)}
                placeholder="Enter RFID"
                required
              />
              <button
                type="submit"
                className="p-3 bg-gray-800 text-white rounded-md cursor-pointer w-full font-bold hover:bg-gray-700 transition duration-200"
              >
                Register Student
              </button>
            </form>
            {registerMessage && <p className="mt-4 text-gray-700 font-medium">{registerMessage}</p>}
          </div>
        )}

        {/* Form for Finding a Student (could be a search feature) */}
        {activeForm === 'find' && (
          <div className="bg-white p-6 rounded-lg col-span-2">
            <p className="font-serif text-sm text-gray-600 mb-2">Find a Student (Search functionality)</p>
            {/* Placeholder for Find Student form */}
          </div>
        )}

        {/* Form to Add New Key */}
        {activeForm === 'key' && (
          <div className="bg-white p-6 rounded-lg col-span-2">
            <form onSubmit={handleSubmit}>
              <p className="font-serif text-sm text-gray-600 mb-2">Enter Student RFID to Book Key</p>
              <input
                type="text"
                className="p-3 rounded-md w-full mb-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={rfId}
                onChange={(e) => setRfId(e.target.value)}
                placeholder="Enter RFID"
                required
              />
              <button
                type="submit"
                className="p-3 bg-gray-800 text-white rounded-md cursor-pointer w-full font-bold hover:bg-gray-700 transition duration-200"
              >
                Book Key
              </button>
            </form>
            {message && <p className="mt-4 text-gray-700 font-medium">{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
