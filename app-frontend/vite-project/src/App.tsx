import { Route, Routes } from "react-router-dom";
import MainLayouts from "./layouts/MainLayouts";
import Home from "./pages/Home";
import AllDoctors from "./pages/AllDoctors";
import BookAppointment from "./pages/BookAppointment";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ApplyDoctor from "./pages/ApplyDoctor";

function App() {
  return (
    <div>
      <Routes>
        <Route element={<MainLayouts />}>
          <Route path="/" element={<Home />} />
          <Route path={`all-doctors/:speciality?`} element={<AllDoctors />} />
          <Route path={`/doctor/:docId`} element={<BookAppointment />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/app-to-be-doctor" element={<ApplyDoctor />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
