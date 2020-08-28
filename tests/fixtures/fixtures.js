import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Counter, Trend } from "k6/metrics";


const fixtures = [
    { url: "competitions/afc-champions-league/fixtures/2020/_allfixtures", tag: "AFC CL Fixtures" },
    //{ url: "competitions/afc-cup/fixtures/2020/_allfixtures", tag: "AFC CUP Fixtures" },
    { url: "live-scores/2020/_carousel", tag: "Carausel" },
    //{ url: "live-scores/2020/_livescores", tag: "Livescores" }
]

let ErrorRate = new Rate("errors");
let FixturesTrend = new Trend('Fixtures Trend');

export const options = {
    stages: [
        { target: 1, duration: '5s' },
        //{ target: 100, duration: '30s' },
        //{ target: 50, duration: '30s' },
        //{ target: 20, duration: '30s' },
    ],
    thresholds: {
        errors: ["count<10"]
    }
};

export default function() {
    const BASE_URL = !!__ENV.HOST ? `${__ENV.HOST}` : "https://www.the-afc.com/";

    group('Fixtures Endpoints', () => {
        let requests = {};
        for (var i in fixtures) {
            let f = fixtures[i];
            requests[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
            //list.push(['GET', `${BASE_URL}${f.url}`, null, { tags: { name: f.tag } }]);
        }

        let responses = http.batch(requests);

        let respCLFixtures = responses['AFC CL Fixtures'];

        const results = Object.values(responses).map(res => res.status);

        const len = results.filter(r => r !== 200).length;

        check(results, {
            "Errors": (r) => r.status === 200
        });

        FixturesTrend.add(respCLFixtures.timings.duration);

        console.log(JSON.stringify(respCLFixtures));

        if (len > 0)
            ErrorRate.add(len / results.length);

        sleep(2);
    });

    function sizeOfHeaders(hdrs) {
        return Object.keys(hdrs).reduce((sum, key) => sum + key.length + hdrs[key].length, 0);
    }
}