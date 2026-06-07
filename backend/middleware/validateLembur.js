const VALID_FORM_TYPES   = ['staff', 'manager', 'outsourcing', 'harian_lepas'];
const VALID_OVERTIME_DAY = ['Hari Libur', 'Hari Kerja'];
const DATE_RE            = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE            = /^\d{2}:\d{2}(:\d{2})?$/;

function err(res, status, message, fields) {
  return res.status(status).json({ success: false, message, ...(fields && { fields }) });
}

function validateEntry(e, i) {
  const errs = [];
  if (!e.name?.trim())         errs.push(`entries[${i}].name is required`);
  if (!e.overtimeDate)         errs.push(`entries[${i}].overtimeDate is required`);
  else if (!DATE_RE.test(e.overtimeDate)) errs.push(`entries[${i}].overtimeDate must be YYYY-MM-DD`);
  if (!e.startTime)            errs.push(`entries[${i}].startTime is required`);
  else if (!TIME_RE.test(e.startTime))    errs.push(`entries[${i}].startTime must be HH:MM`);
  if (!e.endTime)              errs.push(`entries[${i}].endTime is required`);
  else if (!TIME_RE.test(e.endTime))      errs.push(`entries[${i}].endTime must be HH:MM`);
  if (!e.task?.trim())         errs.push(`entries[${i}].task is required`);
  if (!e.result?.trim())       errs.push(`entries[${i}].result is required`);
  if (!e.compensation?.toString().trim()) errs.push(`entries[${i}].compensation is required`);
  return errs;
}

function validateFormBody(req, res, next) {
  const b      = req.body;
  const errors = [];

  if (!b.formType)                          errors.push('formType is required');
  else if (!VALID_FORM_TYPES.includes(b.formType))
    errors.push(`formType must be one of: ${VALID_FORM_TYPES.join(', ')}`);

  if (!b.department?.trim())                errors.push('department is required');
  if (!b.class?.trim())                     errors.push('class is required');

  if (!b.overtimeDay)                       errors.push('overtimeDay is required');
  else if (!VALID_OVERTIME_DAY.includes(b.overtimeDay))
    errors.push(`overtimeDay must be one of: ${VALID_OVERTIME_DAY.join(', ')}`);

  if (!b.submissionDate)                    errors.push('submissionDate is required');
  else if (!DATE_RE.test(b.submissionDate)) errors.push('submissionDate must be YYYY-MM-DD');

  if (!b.requestedBy?.trim())               errors.push('requestedBy is required');

  if (!Array.isArray(b.entries) || b.entries.length === 0)
    errors.push('entries must be a non-empty array');
  else
    b.entries.forEach((e, i) => errors.push(...validateEntry(e, i)));

  if (errors.length)
    return err(res, 422, 'Validation failed', errors);

  next();
}

function validateApproveBody(req, res, next) {
  const b      = req.body;
  const errors = [];

  if (!b.approvedBy?.trim()) errors.push('approvedBy is required');

  if (b.approvedEntryIndices !== undefined) {
    if (!Array.isArray(b.approvedEntryIndices))
      errors.push('approvedEntryIndices must be an array');
    else if (b.approvedEntryIndices.some(i => typeof i !== 'number' || i < 0))
      errors.push('approvedEntryIndices must contain non-negative numbers');
  }

  if (errors.length) return err(res, 422, 'Validation failed', errors);
  next();
}

function validateRejectBody(req, res, next) {
  const b = req.body;
  if (!b.approvedBy?.trim())
    return err(res, 422, 'Validation failed', ['approvedBy is required']);
  next();
}

module.exports = { validateFormBody, validateApproveBody, validateRejectBody };
