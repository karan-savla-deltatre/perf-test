import http from "k6/http";
import { sleep, check } from "k6";
import fixtures from "./fixtures/fixtures.js";
import fixturesv2 from "./fixtures/fixtures_v2.js";

import home from "./pages/home.js";
import comp_home from "./pages/comp_home.js";

export default function() {
    fixtures();
    fixturesv2();
    home();
    comp_home();
};