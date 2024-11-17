import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import StudentHome from "./pages/StudentHome";
import AdminHome from "./components/AdminHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddCertificate from './components/AddCertificate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student-home" element={<StudentHome />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/add-certificate" element={<AddCertificate />} />
      </Routes>
    </Router>
  );
}

export default App;
