import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter } from "k6/metrics";

const requests = [
    { url: "competitions/afc-champions-league", tag: "AFC CL" },
    { url: "competitions/afc-cup", tag: "AFC CUP" },
]

let ErrorCount = new Counter("errors");

export const options = {
    stages: [
        { target: 100, duration: '30s' },
        { target: 200, duration: '30s' },
        { target: 100, duration: '30s' },
        { target: 50, duration: '30s' },
    ],
    thresholds: {
        errors: ["count<10"]
    }
};

export default function() {
    const BASE_URL = `${__ENV.HOST}`;

    group('New Fixtures Endpoints', () => {
        let list = [];
        for (var i in requests) {
            let f = requests[i];
            list.push(['GET', `${BASE_URL}${f.url}`, null, { tags: { name: f.tag } }]);
        }
        let responses = http.batch(list);

        const results = Object.values(responses).map(res => res.status);

        const len = results.filter(r => r !== 200).length;

        check(results, {
            "Errors": (r) => r.status === 200
        });

        if (len > 0)
            ErrorCount.add(len);

        sleep(2);
    });

}