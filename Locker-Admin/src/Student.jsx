import React, { useEffect, useState } from 'react';

// KeyInfoBox Component for displaying individual counts
const KeyInfoBox = ({ title, count }) => (
    <div className="bg-white p-4 shadow-md rounded-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
    </div>
);

const Student = () => {
    const [data, setData] = useState([]);   // Store the fetched data
    const [loading, setLoading] = useState(true);  // Loading state
    const [error, setError] = useState(null);    // Error state

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/student/stack');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
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

    // Render loading or error states
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    // Calculate counts for each category
    const availableKeys = data.filter(student => student.keyStatus === 'Available').length;
    const takenKeys = data.filter(student => student.keyStatus === 'Taken').length;
    const bannedStudents = data.filter(student => student.studentBannedStatus).length;
    const totalWarnings = data.reduce((sum, student) => sum + student.studentWarningStatus, 0);

    return (
        <div className="container mx-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KeyInfoBox title="Available Keys" count={availableKeys} />
                <KeyInfoBox title="Taken Keys" count={takenKeys} />
                <KeyInfoBox title="Banned Students" count={bannedStudents} />
                <KeyInfoBox title="Total Warnings" count={totalWarnings} />
            </div>
        </div>
    );
};

export default Student;
