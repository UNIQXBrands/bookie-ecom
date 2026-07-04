import { supabase } from './supabase';

// ─── mapping ──────────────────────────────────────────────────────────────────

function toRow(inv) {
  return {
    id:          inv.id,
    supplier:    inv.supplier,
    nr:          inv.nr    || null,
    date:        inv.date  || null,
    rate:        inv.rate  ?? null,
    excl:        inv.excl  || null,
    amount:      inv.amount || null,
    amount_excl: inv.amountExcl ?? null,
    btw_amount:  inv.btwAmount  ?? null,
    amount_incl: inv.amountIncl ?? null,
    status:      inv.status || 'pending',
    has_file:    !!inv.hasFile,
    file_name:   inv.fileName || null,
    file_type:   inv.fileType || null,
    file_path:   inv.filePath || null,
  };
}

function fromRow(row) {
  return {
    id:         row.id,
    supplier:   row.supplier,
    nr:         row.nr,
    date:       row.date,
    rate:       row.rate,
    excl:       row.excl,
    amount:     row.amount,
    amountExcl: row.amount_excl,
    btwAmount:  row.btw_amount,
    amountIncl: row.amount_incl,
    status:     row.status,
    hasFile:    row.has_file,
    fileName:   row.file_name,
    fileType:   row.file_type,
    filePath:   row.file_path,
  };
}

// ─── invoices ────────────────────────────────────────────────────────────────

export async function fetchInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function upsertInvoice(inv) {
  const { error } = await supabase
    .from('invoices')
    .upsert(toRow(inv), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteInvoice(id) {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

export async function patchInvoice(id, patch) {
  const dbPatch = {};
  if (patch.hasFile  !== undefined) dbPatch.has_file  = patch.hasFile;
  if (patch.fileName !== undefined) dbPatch.file_name = patch.fileName;
  if (patch.fileType !== undefined) dbPatch.file_type = patch.fileType;
  if (patch.filePath !== undefined) dbPatch.file_path = patch.filePath;
  if (patch.status   !== undefined) dbPatch.status    = patch.status;
  const { error } = await supabase.from('invoices').update(dbPatch).eq('id', id);
  if (error) throw error;
}

// ─── storage ─────────────────────────────────────────────────────────────────

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadFile(invId, dataUrl, fileName) {
  const blob = dataUrlToBlob(dataUrl);
  const path = `${invId}/${fileName}`;
  const { error } = await supabase.storage
    .from('invoice-files')
    .upload(path, blob, { upsert: true });
  if (error) throw error;
  return path;
}

export async function getFileUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('invoice-files')
    .createSignedUrl(filePath, 3600);
  if (error) return null;
  return data.signedUrl;
}

// ─── sales invoices ──────────────────────────────────────────────────────────

function toSalesRow(inv) {
  return {
    id:               inv.id,
    customer_name:    inv.customerName    || null,
    customer_email:   inv.customerEmail   || null,
    customer_address: inv.customerAddress || null,
    invoice_nr:       inv.invoiceNr       || null,
    date:             inv.date            || null,
    due_date:         inv.dueDate         || null,
    line_items:       inv.lineItems       ?? [],
    notes:            inv.notes           || null,
    status:           inv.status          || 'draft',
    amount_excl:      inv.amountExcl      ?? 0,
    btw_amount:       inv.btwAmount       ?? 0,
    amount_incl:      inv.amountIncl      ?? 0,
  };
}

function fromSalesRow(row) {
  return {
    id:              row.id,
    customerName:    row.customer_name,
    customerEmail:   row.customer_email,
    customerAddress: row.customer_address,
    invoiceNr:       row.invoice_nr,
    date:            row.date,
    dueDate:         row.due_date,
    lineItems:       row.line_items || [],
    notes:           row.notes,
    status:          row.status,
    amountExcl:      row.amount_excl,
    btwAmount:       row.btw_amount,
    amountIncl:      row.amount_incl,
    createdAt:       row.created_at,
  };
}

export async function fetchSalesInvoices() {
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromSalesRow);
}

export async function upsertSalesInvoice(inv) {
  const { error } = await supabase
    .from('sales_invoices')
    .upsert(toSalesRow(inv), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteSalesInvoice(id) {
  const { error } = await supabase.from('sales_invoices').delete().eq('id', id);
  if (error) throw error;
}
