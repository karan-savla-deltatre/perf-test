import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const fixtures = [
    { url: 'competitions/afc-champions-league/fixtures/2020/_config', tag: 'AFC CL Fixtures' },
    //{ url: "competitions/afc-cup/fixtures/2020/_config", tag: "AFC CUP Fixtures" },
    { url: 'live-scores/2020/_carousel_', tag: 'Carausel' }
    //{ url: "live-scores/2020/_livescores_", tag: "Livescores" }
];

const fixtures_old = [
    { url: 'competitions/afc-champions-league/fixtures/2020/_allfixtures', tag: 'AFC CL Fixtures Old' },
    //{ url: "competitions/afc-cup/fixtures/2020/_allfixtures", tag: "AFC CUP Fixtures" },
    { url: 'live-scores/2020/_carousel', tag: 'Carausel Old' }
    //{ url: "live-scores/2020/_livescores", tag: "Livescores" }
];

const hpreqs = [{ url: '', tag: 'AFC HP' }];

const dapireqs = [
    { url: 'https://dapi.the-afc.com/v1/content/en-gb/stories', tag: 'DAPI Stories' },
    { url: 'https://dapi.the-afc.com/v1/content/en-gb/divavideos', tag: 'DAPI Videos' }
];

const compreqs = [
    { url: 'competitions/afc-champions-league', tag: 'AFC CL' },
    { url: 'competitions/afc-cup', tag: 'AFC CUP' }
];

let ErrorRate = new Rate('errors');
let FixturesTrend = new Trend('Fixtures Trend');
let OldFixturesTrend = new Trend('Old Fixtures Trend');
let HPTrend = new Trend('AFC HP');
let DSTrend = new Trend('DAPI Stories');
let DDTrend = new Trend('DAPI DV');
let CLTrend = new Trend('AFC CL');
let CUPTrend = new Trend('AFC CUP');

let FixturesData = new Counter('Data Fixtures Trend');
let OldFixturesData = new Counter('Data Old Fixtures Trend');
let HPData = new Counter('Data FC HP');
let DSData = new Counter('Data DAPI Stories');
let DDData = new Counter('Data DAPI DV');
let CLData = new Counter('Data AFC CL');
let CUPData = new Counter('Data AFC CUP');

export const options = {
    stages: [
        { target: 50, duration: '30s' },
        { target: 100, duration: '30s' },
        { target: 50, duration: '30s' },
        { target: 20, duration: '30s' }
    ],
    thresholds: {
        errors: ['rate<0.1'],
        'AFC HP': ['p(95)<7000'],
        'AFC CL': ['p(95)<7000'],
        'AFC CUP': ['p(95)<7000'],
        'DAPI DV': ['p(95)<1200'],
        'DAPI Stories': ['p(95)<1200'],
        'Fixtures Trend': ['p(95)<3000'],
        'Old Fixtures Trend': ['p(95)<5000']
    }
};

export default function() {
    const BASE_URL = !!__ENV.HOST ? `${__ENV.HOST}` : 'https://www.the-afc.com/';

    group('New Fixtures Endpoints', () => {
        let requests = {};
        for (var i in fixtures) {
            let f = fixtures[i];
            requests[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
        }
        let responses = http.batch(requests);

        let respCLFixtures = responses['AFC CL Fixtures'];

        const results = Object.values(responses).map((res) => res.status);

        const len = results.filter((r) => r !== 200).length;

        check(responses["AFC CL Fixtures"], {
            "AFC CL Fixtures Responsed Successfully": (r) => r.status === 200,
        });

        FixturesTrend.add(respCLFixtures.timings.duration);
        FixturesData.add(respCLFixtures.body.length / (1024 * 1024));

        ErrorRate.add(len / results.length);

        sleep(2);
    });

    group('Fixtures Endpoints', () => {
        let requests = {};
        for (var i in fixtures_old) {
            let f = fixtures_old[i];
            requests[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
            //list.push(['GET', `${BASE_URL}${f.url}`, null, { tags: { name: f.tag } }]);
        }

        let responses = http.batch(requests);

        let respCLFixtures = responses['AFC CL Fixtures Old'];

        const results = Object.values(responses).map((res) => res.status);

        const len = results.filter((r) => r !== 200).length;

        check(responses["AFC CL Fixtures Old"], {
            "AFC CL Fixtures Old Responsed Successfully": (r) => r.status === 200,
        });

        OldFixturesTrend.add(respCLFixtures.timings.duration);
        OldFixturesData.add(respCLFixtures.body.length / (1024 * 1024));

        ErrorRate.add(len / results.length);

        sleep(2);
    });

    group('AFC HP Endpoints', () => {
        let links = {};
        for (var i in hpreqs) {
            let f = hpreqs[i];
            links[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
        }
        let responses = http.batch(links);

        const results = Object.values(responses).map((res) => res.status);

        let respHP = responses['AFC HP'];
        const len = results.filter((r) => r !== 200).length;

        check(responses["AFC HP"], {
            "AFC HP Responsed Successfully": (r) => r.status === 200,
        });

        HPTrend.add(respHP.timings.duration);
        HPData.add(respHP.body.length / (1024 * 1024));

        ErrorRate.add(len / results.length);

        sleep(2);
    });

    group('DAPI Endpoints', () => {
        let links = {};
        for (var i in dapireqs) {
            let f = dapireqs[i];
            links[f.tag] = { method: 'GET', url: `${f.url}` };
        }
        let responses = http.batch(links);

        const results = Object.values(responses).map((res) => res.status);

        let respDS = responses['DAPI Stories'];
        let respDV = responses['DAPI Videos'];
        const len = results.filter((r) => r !== 200).length;

        check(responses["DAPI Stories"], {
            "DAPI Stories Responsed Successfully": (r) => r.status === 200,
        });

        DSTrend.add(respDS.timings.duration);
        DDTrend.add(respDV.timings.duration);

        DSData.add(respDS.body.length / (1024 * 1024));
        DDData.add(respDV.body.length / (1024 * 1024));

        ErrorRate.add(len / results.length);

        sleep(2);
    });

    group('Competition HP Endpoints', () => {
        let links = {};
        for (var i in compreqs) {
            let f = compreqs[i];
            links[f.tag] = { method: 'GET', url: `${BASE_URL}${f.url}` };
        }
        let responses = http.batch(links);

        const results = Object.values(responses).map((res) => res.status);

        let respCL = responses['AFC CL'];
        let respCUP = responses['AFC CUP'];
        const len = results.filter((r) => r !== 200).length;

        check(responses["AFC CL"], {
            "AFC CL Responsed Successfully": (r) => r.status === 200,
        });

        check(responses["AFC CUP"], {
            "AFC CUP Responsed Successfully": (r) => r.status === 200,
        });

        CLTrend.add(respCL.timings.duration);
        CUPTrend.add(respCUP.timings.duration);
        CLData.add(respCL.body.length / (1024 * 1024));
        CUPData.add(respCL.body.length / (1024 * 1024));

        ErrorRate.add(len / results.length);

        sleep(2);
    });
}
