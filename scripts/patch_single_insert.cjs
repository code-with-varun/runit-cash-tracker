const fs = require('fs');

let content = fs.readFileSync('api/transactions.php', 'utf8');

const targetCols = `                        mode, category, \`month\`, \`year\`, week_no, \`year_month\`, 
                        tran_type_helper, audit_status, utr_no
                    ) VALUES (
                        :user_id, :account_id, :account_no, :date, :category_id, :category_name, 
                        :subcategory, :group_type, :net_type, :sub_type, :transaction_type, 
                        :type, :amount, :balance, :notes, :date_group, :temp_upload_id, :tran_no,
                        :tagging, :job_utils, :compensation_type, :split_ref, :info_type, 
                        :info_status, :eid, :allocation_eid, :job_timeline, :remarks, 
                        :account_type, :suffix, :keyword_tagging, :sub_cat_helper, :method, 
                        :mode, :category, :month, :year, :week_no, :year_month, 
                        :tran_type_helper, :audit_status, :utr_no
                    )`;

const replacementCols = `                        mode, category, \`month\`, \`year\`, week_no, \`year_month\`, 
                        tran_type_helper, audit_status, utr_no, budget, cost_center, profit_center, project, division
                    ) VALUES (
                        :user_id, :account_id, :account_no, :date, :category_id, :category_name, 
                        :subcategory, :group_type, :net_type, :sub_type, :transaction_type, 
                        :type, :amount, :balance, :notes, :date_group, :temp_upload_id, :tran_no,
                        :tagging, :job_utils, :compensation_type, :split_ref, :info_type, 
                        :info_status, :eid, :allocation_eid, :job_timeline, :remarks, 
                        :account_type, :suffix, :keyword_tagging, :sub_cat_helper, :method, 
                        :mode, :category, :month, :year, :week_no, :year_month, 
                        :tran_type_helper, :audit_status, :utr_no, :budget, :cost_center, :profit_center, :project, :division
                    )`;

if (content.includes(targetCols)) {
  content = content.replace(targetCols, replacementCols);
  console.log('Replaced SQL columns in single insert');
} else {
  console.log('Could not find targetCols');
}

const targetParams = `                    ':audit_status' => in_array($input['auditStatus'] ?? ($input['status'] ?? ''), ['draft', 'verified', 'frozen']) ? ($input['auditStatus'] ?? $input['status']) : 'draft',
                    ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                ]);`;

const replacementParams = `                    ':audit_status' => in_array($input['auditStatus'] ?? ($input['status'] ?? ''), ['draft', 'verified', 'frozen']) ? ($input['auditStatus'] ?? $input['status']) : 'draft',
                    ':utr_no' => $input['utrNo'] ?? ($input['utr_no'] ?? null),
                    ':budget' => ($type === 'Dr') ? ($input['budget'] ?? null) : null,
                    ':cost_center' => ($type === 'Dr') ? ($input['costCenter'] ?? ($input['cost_center'] ?? null)) : null,
                    ':profit_center' => ($type === 'Cr') ? ($input['profitCenter'] ?? ($input['profit_center'] ?? null)) : null,
                    ':project' => $input['project'] ?? null,
                    ':division' => $input['division'] ?? ($catObj['division'] ?? $group),
                ]);`;

if (content.includes(targetParams)) {
  content = content.replace(targetParams, replacementParams);
  console.log('Replaced parameter bindings in single insert');
} else {
  console.log('Could not find targetParams');
}

fs.writeFileSync('api/transactions.php', content, 'utf8');
console.log('Saved api/transactions.php');

