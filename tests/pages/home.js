import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Trend } from "k6/metrics";


const requests = [
    { url: "", tag: "AFC HP" },
    //{ url: "competitions/afc-cup/fixtures/2020/_allfixtures", tag: "AFC CUP Fixtures" },
    //{ url: "live-scores/2020/_livescores", tag: "Livescores" }
]

let ErrorCount = new Counter("errors");
let HPTrend = new Trend("AFC HP");

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
    const BASE_URL = `${__ENV.HOST}`;

    group('AFC HP Endpoints', () => {
        let links = {};
        for (var i in requests) {
            let f = requests[i];
            links[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
        }
        let responses = http.batch(links);

        const results = Object.values(responses).map(res => res.status);

        let respHP = responses["AFC HP"];
        const len = results.filter(r => r !== 200).length;

        check(results, {
            "Errors": (r) => r.status === 200
        });

        HPTrend.add(respHP.timings.duration);

        if (len > 0)
            ErrorCount.add(len);

        sleep(2);
    });

}