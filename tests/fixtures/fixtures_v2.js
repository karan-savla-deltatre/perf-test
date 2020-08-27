import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Trend } from "k6/metrics";

const fixtures = [
    { url: "competitions/afc-champions-league/fixtures/2020/_config", tag: "AFC CL Fixtures" },
    //{ url: "competitions/afc-cup/fixtures/2020/_config", tag: "AFC CUP Fixtures" },
    { url: "live-scores/2020/_carousel_", tag: "Carausel" },
    //{ url: "live-scores/2020/_livescores_", tag: "Livescores" }
]

let ErrorCount = new Counter("errors");
let FixturesTrend = new Trend('Fixtures Trend');

export const options = {
    stages: [
        { target: 50, duration: '30s' },
        { target: 100, duration: '30s' },
        { target: 50, duration: '30s' },
        { target: 20, duration: '30s' },
    ],
    thresholds: {
        errors: ["count<10"]
    }
};

export default function() {
    const BASE_URL = !!__ENV.HOST ? `${__ENV.HOST}` : "https://www.the-afc.com/";

    group('New Fixtures Endpoints', () => {
        let requests = {};
        for (var i in fixtures) {
            let f = fixtures[i];
            requests[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
        }
        let responses = http.batch(requests);

        let respCLFixtures = responses['AFC CL Fixtures'];

        const results = Object.values(responses).map(res => res.status);

        const len = results.filter(r => r !== 200).length;

        check(results, {
            "Errors": (r) => r.status === 200
        });

        FixturesTrend.add(respCLFixtures.timings.duration);

        if (len > 0)
            ErrorCount.add(len);


        sleep(2);
    });

}