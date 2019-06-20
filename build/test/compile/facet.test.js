"use strict";
/* tslint:disable quotemark */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var channel_1 = require("../../src/channel");
var log = tslib_1.__importStar(require("../../src/log"));
var type_1 = require("../../src/type");
var util_1 = require("../util");
describe('FacetModel', function () {
    describe('initFacet', function () {
        it('should drop unsupported channel and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: ({
                    shape: { field: 'a', type: 'quantitative' }
                }),
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.equal(model.facet['shape'], undefined);
            chai_1.assert.equal(localLogger.warns[0], log.message.incompatibleChannel(channel_1.SHAPE, 'facet'));
        }));
        it('should drop channel without field and value and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: {
                    row: { type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.equal(model.facet.row, undefined);
            chai_1.assert.equal(localLogger.warns[0], log.message.emptyFieldDef({ type: type_1.ORDINAL }, channel_1.ROW));
        }));
        it('should drop channel without field and value and throws warning', log.wrap(function (localLogger) {
            var model = util_1.parseFacetModel({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {}
                }
            });
            chai_1.assert.deepEqual(model.facet.row, { field: 'a', type: 'quantitative' });
            chai_1.assert.equal(localLogger.warns[0], log.message.facetChannelShouldBeDiscrete(channel_1.ROW));
        }));
    });
    describe('parseAxisAndHeader', function () {
        // TODO: add more tests
        // - correctly join title for nested facet
        // - correctly generate headers with right labels and axes
        it('applies text format to the fieldref of a temporal field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { timeUnit: 'year', field: 'date', type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "timeFormat(parent[\"year_date\"], '%Y')");
        });
        it('applies number format for fieldref of a quantitative field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative', format: 'd' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "format(parent[\"a\"], 'd')");
        });
        it('ignores number format for fieldref of a binned field', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { bin: true, field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert(columnHeader.title.text.signal, "parent[\"a\"]");
        });
    });
    describe('parseScale', function () {
        it('should correctly set scale component for a model', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                }
            });
            chai_1.assert(model.component.scales['x']);
        });
        it('should create independent scales if resolve is set to independent', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                },
                resolve: {
                    scale: {
                        x: 'independent'
                    }
                }
            });
            chai_1.assert(!model.component.scales['x']);
        });
    });
    describe('assembleHeaderMarks', function () {
        it('should sort headers in ascending order', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative', format: 'd' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' },
                        y: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parseAxisAndHeader();
            var headerMarks = model.assembleHeaderMarks();
            var columnHeader = headerMarks.filter(function (d) {
                return d.name === "column_header";
            })[0];
            chai_1.assert.deepEqual(columnHeader.sort, { field: 'datum["a"]', order: 'ascending' });
        });
    });
    describe('assembleGroup', function () {
        it('includes a columns fields in the encode block for facet with column that parent is also a facet.', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parseData();
            var group = model.child.assembleGroup([]);
            chai_1.assert.deepEqual(group.encode.update.columns, { field: 'distinct_c' });
        });
    });
    describe('assembleLayout', function () {
        it('returns a layout with a column signal for facet with column', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'b', type: 'quantitative' }
                    }
                }
            });
            var layout = model.assembleLayout();
            chai_1.assert.deepEqual(layout, {
                padding: { row: 10, column: 10 },
                columns: {
                    signal: "length(data('column_domain'))"
                },
                bounds: 'full',
                align: 'all'
            });
        });
        it('returns a layout without a column signal for facet with column that parent is also a facet.', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            var layout = model.child.assembleLayout();
            chai_1.assert.deepEqual(layout.columns, undefined);
        });
        it('returns a layout with header band if child spec is also a facet', function () {
            var model = util_1.parseFacetModelWithScale({
                "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
                "data": { "url": "data/cars.json" },
                "facet": { "row": { "field": "Origin", "type": "ordinal" } },
                "spec": {
                    "facet": { "row": { "field": "Cylinders", "type": "ordinal" } },
                    "spec": {
                        "mark": "point",
                        "encoding": {
                            "x": { "field": "Horsepower", "type": "quantitative" },
                            "y": { "field": "Acceleration", "type": "quantitative" }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parseLayoutSize();
            model.parseAxisAndHeader();
            var layout = model.assembleLayout();
            chai_1.assert.deepEqual(layout.headerBand, { row: 0.5 });
        });
    });
    describe('assembleMarks', function () {
        it('should add cross and sort if we facet by multiple dimensions', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal' },
                    column: { field: 'b', type: 'ordinal' }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert(marks[0].from.facet.aggregate.cross);
            chai_1.assert.deepEqual(marks[0].sort, {
                field: [
                    'datum["a"]',
                    'datum["b"]'
                ],
                order: [
                    'ascending',
                    'ascending'
                ]
            });
        });
        it('should add cross and sort if we facet by multiple dimensions with sort array', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal', sort: ['a1', 'a2'] },
                    column: { field: 'b', type: 'ordinal', sort: ['b1', 'b2'] }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert(marks[0].from.facet.aggregate.cross);
            expect(marks[0].sort).toEqual({
                field: [
                    'datum["row_a_sort_index"]',
                    'datum["column_b_sort_index"]'
                ],
                order: [
                    'ascending',
                    'ascending'
                ]
            });
        });
        it('should add cross and sort if we facet by multiple dimensions with sort fields', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal', sort: { field: 'd', op: 'median' } },
                    column: { field: 'b', type: 'ordinal', sort: { field: 'e', op: 'median' } }
                },
                spec: {
                    mark: 'point',
                    encoding: {
                        x: { field: 'c', type: 'quantitative' }
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            expect(marks[0].from.facet.aggregate).toEqual({
                cross: true,
                fields: ['median_d_by_a', 'median_e_by_b'],
                ops: ['max', 'max'],
                as: ['median_d_by_a', 'median_e_by_b']
            });
            expect(marks[0].sort).toEqual({
                field: [
                    'datum["median_d_by_a"]',
                    'datum["median_e_by_b"]'
                ],
                order: [
                    'ascending',
                    'ascending'
                ]
            });
        });
        it('should add calculate cardinality for independent scales', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    row: { field: 'a', type: 'ordinal' }
                },
                spec: {
                    mark: 'rect',
                    encoding: {
                        x: { field: 'b', type: 'nominal' },
                        y: { field: 'c', type: 'nominal' }
                    }
                },
                resolve: {
                    scale: {
                        x: 'independent',
                        y: 'independent'
                    }
                }
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert.deepEqual(marks[0].from.facet.aggregate, {
                fields: ['b', 'c'],
                ops: ['distinct', 'distinct'],
                as: ['distinct_b', 'distinct_c']
            });
        });
        it('should add calculate cardinality for child column facet', function () {
            var model = util_1.parseFacetModelWithScale({
                facet: {
                    column: { field: 'a', type: 'quantitative' }
                },
                spec: {
                    facet: {
                        column: { field: 'c', type: 'quantitative' }
                    },
                    spec: {
                        mark: 'point',
                        encoding: {
                            x: { field: 'b', type: 'quantitative' }
                        }
                    }
                }
                // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            });
            model.parse();
            var marks = model.assembleMarks();
            chai_1.assert.deepEqual(marks[0].from.facet.aggregate, {
                fields: ['c'],
                ops: ['distinct'],
                as: ['distinct_c']
            });
        });
    });
});
//# sourceMappingURL=facet.test.js.map