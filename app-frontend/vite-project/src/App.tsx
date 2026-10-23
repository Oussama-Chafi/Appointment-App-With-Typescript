import { Route, Routes } from "react-router-dom";
import MainLayouts from "./layouts/MainLayouts";
import Home from "./pages/Home";
import AllDoctors from "./pages/AllDoctors";

function App() {
  return (
    <div>
      <Routes>
        <Route element={<MainLayouts />}>
          <Route path="/" element={<Home />} />
          <Route path={`all-doctors/:speciality?`} element ={<AllDoctors/>}/>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
