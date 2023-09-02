import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState(null);
  const [editingGrades, setEditingGrades] = useState(false); // New state variable
  const [previousPassStatus, setPreviousPassStatus] = useState({}); // State variable to store

  useEffect(() => {
    fetch('http://127.0.0.1:5000/tasks')
      .then((res) => res.json())
      .then((data) => {
        console.log("taskId",taskId)
        const selectedTask = data.find((task) => task.name === taskId);

        setTask(selectedTask);
      });
  }, [taskId]);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/students')
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  // Function to extract the value associated with key 'a'
    function extract_grade(name,list) {
      for (const obj of list) {
        if (name in obj) {
          return obj[name];
        }
      }
      return undefined; // Return undefined if 'a' key is not found
    }

  useEffect(() => {
    console.log("task",task);

    if (task && task.status === 'graded') {
      
      console.log("init",students)
      const gradesData = students.map((student) => {
        console.log(String(task.name))

        console.log("aa",student.tasks)
        console.log("vot",student.tasks.map(obj => obj['task1']));
        const grade = extract_grade(task.name,student.tasks) === 0 ? 'fail' : 'pass';
        console.log(grade)
        return {
          name: student.name,
          grade: grade,
        };
      });
      setGrades(gradesData);
  
      // Store previous pass status when the task status changes to "graded"
      const prevPassStatus = {};
      students.forEach((student) => {
        prevPassStatus[student.name] = student[task.name] === 1 ? true : false;
      });
      setPreviousPassStatus(prevPassStatus);
    }
  }, [task, students]);
  
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get the form data (student names and pass/fail status)
    const formData = new FormData(e.target);
    const updatedStudents = [];

    students.forEach((student) => {
      const studentName = student.name;
      const passStatus = formData.get(studentName) === 'pass';
      console.log("student with id",student);
      console.log(task);

      const updatedStudent = {
        ...student,
        tasks: student.tasks.map(taskObj => {
          if (task.name in taskObj) {
            return { [task.name]: passStatus ? 1 : 0 };
          }
          return taskObj;
        }),
          score:
          (task.status === 'ungraded' || (task.status === 'graded' && !previousPassStatus[studentName])) && passStatus
            ? student.score + 1*task.weight
            : (task.status === 'graded' && previousPassStatus[studentName] && !passStatus)
            ? student.score - 1*task.weight
            : student.score,
      };
      
            
      console.log("updatedStudent", updatedStudent);
      updatedStudents.push(updatedStudent);
    });

    // Update the task status to "graded"
    const updatedTask = {
      ...task,
      status: 'graded',
    };

    // Send the updated student data and the updated task object to the backend
    fetch(`http://127.0.0.1:5000/update_students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: updatedTask, students: updatedStudents }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Update the task status to "graded" in the frontend state
        setTask(updatedTask);
        window.location.reload();
      });
  };

  const handleEditGrades = () => {
    setEditingGrades(true);
  };

  const handleCancelEdit = () => {
    setEditingGrades(false);
  };

  if (!task) {
    return <div>Loading...</div>;
  }

  return (
    <div className="task-detail-page">
      <h2>Task Details</h2>
      <p>Task Name: {task.name}</p>
      <p>Task Status: {task.status}</p>

      {/* Display the form if the task status is "ungraded" */}
      {task.status === 'ungraded' && (
        <form onSubmit={handleFormSubmit}>
          <h3>Task Grading Form</h3>
          {students.map((student) => (
            <div key={student.id}>
              <label>
                {student.name}
                <select name={student.name}>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </label>
            </div>
          ))}
          <button type="submit">Submit</button>
        </form>
      )}

      {task.status === 'graded' && (editingGrades ? (
        // Render the form if editingGrades is true
        <form onSubmit={handleFormSubmit}>
          <h3>Task Grading Form</h3>
          {students.map((student) => (
            <div key={student.id}>
              <label>
                {student.name}
                <select name={student.name}>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </label>
            </div>
          ))}
          <button type="submit">Submit</button>
          <button type="button" onClick={handleCancelEdit}>
            Cancel
          </button>
        </form>
      ) : (
        // Render the table if editingGrades is false
        <div>
          <h3>Grades</h3>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades &&
                grades.map((grade) => (
                  <tr key={grade.name}>
                    <td>{grade.name}</td>
                    <td>{grade.grade}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {task.status === 'graded' && (
            <button onClick={handleEditGrades}>Change Grades</button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskDetailPage;