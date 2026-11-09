const fs = require('fs');
let code = fs.readFileSync('api/transactions.php', 'utf8');

// 1. Update SELECT in GET
const selectOld = `                       tran_type_helper AS tranTypeHelper,
                       utr_no AS utrNo`;
const selectNew = `                       tran_type_helper AS tranTypeHelper,
                       utr_no AS utrNo,
                       budget, cost_center AS costCenter, profit_center AS profitCenter, project, division`;
code = code.replace(selectOld, selectNew);

// 2. Update mapping in GET
const mapOld = `$tx['tempUploadId'] = $tx['tempUploadId'] ?: '';`;
const mapNew = `$tx['tempUploadId'] = $tx['tempUploadId'] ?: '';
                $tx['budget'] = $tx['budget'] ?? '';
                $tx['costCenter'] = $tx['costCenter'] ?? ($tx['cost_center'] ?? '');
                $tx['profitCenter'] = $tx['profitCenter'] ?? ($tx['profit_center'] ?? '');
                $tx['project'] = $tx['project'] ?? '';
                $tx['division'] = $tx['division'] ?? ($tx['groupType'] ?? '');`;
code = code.replace(mapOld, mapNew);

// 3. Update Bulk Insert SQL in POST
const bulkInsertSqlOld = `tran_type_helper, audit_status, utr_no
                    ) VALUES (`;
const bulkInsertSqlNew = `tran_type_helper, audit_status, utr_no, budget, cost_center, profit_center, project, division
                    ) VALUES (`;
code = code.replace(bulkInsertSqlOld, bulkInsertSqlNew);

const bulkInsertValOld = `:tran_type_helper, :audit_status, :utr_no
                    )`;
const bulkInsertValNew = `:tran_type_helper, :audit_status, :utr_no, :budget, :cost_center, :profit_center, :project, :division
                    )`;
code = code.replace(bulkInsertValOld, bulkInsertValNew);

// In bulk loop:
const bulkParamOld = `':utr_no' => $tx['utrNo'] ?? ($tx['utr_no'] ?? null),
                    ]);`;
const bulkParamNew = `':utr_no' => $tx['utrNo'] ?? ($tx['utr_no'] ?? null),
                        ':budget' => $tx['budget'] ?? null,
                        ':cost_center' => ($type === 'Dr' || $txType !== 'ACTUAL') ? ($tx['costCenter'] ?? ($tx['cost_center'] ?? null)) : null,
                        ':profit_center' => ($type === 'Cr') ? ($tx['profitCenter'] ?? ($tx['profit_center'] ?? null)) : null,
                        ':project' => $tx['project'] ?? null,
                        ':division' => $tx['division'] ?? ($cMeta ? $cMeta['division'] : ($group ?: 'LIVING')),
                    ]);`;
code = code.replace(bulkParamOld, bulkParamNew);

// 4. Update Single Insert SQL in POST
const singleInsertSqlOld = `tran_type_helper, audit_status, utr_no
                    ) VALUES (`;
// (Already replaced if matched above, let's make sure both occurrences or specific ones are handled)

// Let's do a reliable replacement for single insert:
const singleExecOld = `':audit_status' => 'draft',
                    ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                ]);`;
const singleExecNew = `':audit_status' => 'draft',
                    ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                    ':budget' => $input['budget'] ?? null,
                    ':cost_center' => ($type === 'Dr' || $txType !== 'ACTUAL') ? ($input['costCenter'] ?? ($input['cost_center'] ?? null)) : null,
                    ':profit_center' => ($type === 'Cr') ? ($input['profitCenter'] ?? ($input['profit_center'] ?? null)) : null,
                    ':project' => $input['project'] ?? null,
                    ':division' => $input['division'] ?? ($cMeta ? $cMeta['division'] : ($group ?: 'LIVING')),
                ]);`;
code = code.replace(singleExecOld, singleExecNew);

// 5. Update PUT
const putSqlOld = `tran_no = COALESCE(:tran_no, tran_no),
                    audit_status = :audit_status,`;
const putSqlNew = `tran_no = COALESCE(:tran_no, tran_no),
                    budget = COALESCE(:budget, budget),
                    cost_center = :cost_center,
                    profit_center = :profit_center,
                    project = COALESCE(:project, project),
                    division = COALESCE(:division, division),
                    audit_status = :audit_status,`;
code = code.replace(putSqlOld, putSqlNew);

const putParamOld = `':audit_status' => $statusVal,
            ]);`;
const putParamNew = `':audit_status' => $statusVal,
                ':budget' => $input['budget'] ?? null,
                ':cost_center' => (isset($input['type']) && $input['type'] === 'Cr') ? null : ($input['costCenter'] ?? ($input['cost_center'] ?? null)),
                ':profit_center' => (isset($input['type']) && $input['type'] === 'Dr') ? null : ($input['profitCenter'] ?? ($input['profit_center'] ?? null)),
                ':project' => $input['project'] ?? null,
                ':division' => $input['division'] ?? ($cMeta ? $cMeta['division'] : null),
            ]);`;
code = code.replace(putParamOld, putParamNew);

fs.writeFileSync('api/transactions.php', code, 'utf8');
console.log('Successfully patched transactions.php');

