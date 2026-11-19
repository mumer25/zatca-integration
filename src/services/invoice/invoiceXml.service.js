import { create } from "xmlbuilder2";

const NS = {
  invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
};

function money(value) {
  return Number(value).toFixed(2);
}

function addText(parent, name, value, attributes = {}) {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required XML value: ${name}`);
  }

  const element = parent.ele(`cbc:${name}`, attributes);
  element.txt(String(value));

  return element;
}

function addAmount(parent, name, value, currency) {
  return addText(parent, name, money(value), {
    currencyID: currency
  });
}


function addAddress(parent, party) {
  const address = parent.ele("cac:PostalAddress");

  addText(address, "StreetName", party.street);
  addText(address, "BuildingNumber", party.buildingNumber);
  addText(address, "PlotIdentification", party.additionalNumber);
  addText(address, "CitySubdivisionName", party.neighborhood);
  addText(address, "CityName", party.city);
  addText(address, "PostalZone", party.postalCode);
  addText(address, "CountrySubentity", party.region);

  const country = address.ele("cac:Country");
  addText(country, "IdentificationCode", party.country);

  return address;
}

function addParty(parent, party, isSeller = false) {
  const accountingParty = parent.ele("cac:Party");

  if (isSeller) {
    const identification = accountingParty.ele(
      "cac:PartyIdentification"
    );

    addText(identification, "ID", party.registrationNumber, {
      schemeID: "CRN"
    });
  }

  addAddress(accountingParty, party);

  const taxScheme = accountingParty.ele("cac:PartyTaxScheme");

  addText(taxScheme, "CompanyID", party.vatNumber);

  const scheme = taxScheme.ele("cac:TaxScheme");
  addText(scheme, "ID", "VAT");

  const legalEntity = accountingParty.ele("cac:PartyLegalEntity");
  addText(legalEntity, "RegistrationName", party.name);

  return accountingParty;
}

function addDocumentReferences(root, data) {
  // Invoice Counter Value (ICV)
  const icv = root.ele("cac:AdditionalDocumentReference");

  addText(icv, "ID", "ICV");
  addText(icv, "UUID", data.icv);

  // Previous Invoice Hash (PIH)
  const pih = root.ele("cac:AdditionalDocumentReference");

  addText(pih, "ID", "PIH");

  const attachment = pih.ele("cac:Attachment");

  addText(
    attachment,
    "EmbeddedDocumentBinaryObject",
    data.pih,
    { mimeCode: "text/plain" }
  );
}

function addTaxTotals(
  root,
  netTotal,
  vatTotal,
  currency,
  vatCategory,
  vatRate
) {
  // Tax total containing tax subtotal breakdown
  const taxTotal = root.ele("cac:TaxTotal");

  addAmount(taxTotal, "TaxAmount", vatTotal, currency);

  const subtotal = taxTotal.ele("cac:TaxSubtotal");

  addAmount(subtotal, "TaxableAmount", netTotal, currency);
  addAmount(subtotal, "TaxAmount", vatTotal, currency);

  const category = subtotal.ele("cac:TaxCategory");

  addText(category, "ID", vatCategory);
addText(category, "Percent", vatRate);

  const taxScheme = category.ele("cac:TaxScheme");
  addText(taxScheme, "ID", "VAT");

  // Second tax total without subtotals
  const summaryTaxTotal = root.ele("cac:TaxTotal");

  addAmount(summaryTaxTotal, "TaxAmount", vatTotal, currency);
}

export function generateStandardInvoiceXml(data) {
  if (!data?.seller || !data?.buyer || !data?.item) {
    throw new Error("Seller, buyer and item information are required.");
  }

 const supportedInvoiceTypes = {
  "0100000": "Standard",
  "0200000": "Simplified"
};

if (
  data.invoiceTypeCode !== "388" ||
  !supportedInvoiceTypes[data.invoiceTypeName]
) {
  throw new Error("Unsupported invoice type.");
}

  if (!/^[0-9]{4}$/.test(data.seller.additionalNumber || "")) {
    throw new Error("Seller additional number must contain 4 digits.");
  }

  if (!/^[0-9]{4}$/.test(data.buyer.additionalNumber || "")) {
    throw new Error("Buyer additional number must contain 4 digits.");
  }

  if (!/^[a-zA-Z0-9]+$/.test(data.seller.registrationNumber || "")) {
    throw new Error("Seller registration number must be alphanumeric.");
  }

  if (!/^[0-9]+$/.test(String(data.icv || ""))) {
    throw new Error("ICV must contain digits only.");
  }

  if (!data.pih) {
    throw new Error("Previous invoice hash (PIH) is required.");
  }

  const quantity = Number(data.item.quantity);
  const unitPrice = Number(data.item.unitPrice);
  const vatRate = Number(data.item.vatRate);

  if (
    !Number.isFinite(quantity) || quantity <= 0 ||
    !Number.isFinite(unitPrice) || unitPrice < 0 ||
    !Number.isFinite(vatRate) || vatRate < 0
  ) {
    throw new Error("Invalid quantity, unit price or VAT rate.");
  }

  const netTotal = quantity * unitPrice;
  const vatTotal = netTotal * vatRate / 100;
  const grossTotal = netTotal + vatTotal;

  const currency = data.currency || "SAR";

const root = create({
  version: "1.0",
  encoding: "UTF-8"
}).ele("Invoice", {
  xmlns: NS.invoice,
  "xmlns:cac": NS.cac,
  "xmlns:cbc": NS.cbc,
  "xmlns:ext": NS.ext
});

  addText(root, "UBLVersionID", "2.1");
  addText(root, "CustomizationID", "urn:cen.eu:en16931:2017");
  addText(root, "ProfileID", "reporting:1.0");
  addText(root, "ID", data.id);
  addText(root, "UUID", data.uuid);
  addText(root, "IssueDate", data.issueDate);
  addText(root, "IssueTime", data.issueTime);

  addText(root, "InvoiceTypeCode", data.invoiceTypeCode, {
    name: data.invoiceTypeName
  });

  addText(root, "DocumentCurrencyCode", currency);
  addText(root, "TaxCurrencyCode", currency);

  addDocumentReferences(root, data);

  const supplier = root.ele("cac:AccountingSupplierParty");
  addParty(supplier, data.seller, true);

  const customer = root.ele("cac:AccountingCustomerParty");
  addParty(customer, data.buyer, false);

  // Supply date
  const delivery = root.ele("cac:Delivery");
  addText(delivery, "ActualDeliveryDate", data.supplyDate);

  const payment = root.ele("cac:PaymentMeans");
  addText(payment, "PaymentMeansCode", "10");

  addTaxTotals(
  root,
  netTotal,
  vatTotal,
  currency,
  data.item.vatCategory || "S",
  vatRate
);

  const monetary = root.ele("cac:LegalMonetaryTotal");

  addAmount(monetary, "LineExtensionAmount", netTotal, currency);
  addAmount(monetary, "TaxExclusiveAmount", netTotal, currency);
  addAmount(monetary, "TaxInclusiveAmount", grossTotal, currency);
  addAmount(monetary, "PayableAmount", grossTotal, currency);

  const line = root.ele("cac:InvoiceLine");

  addText(line, "ID", "1");

  addText(line, "InvoicedQuantity", quantity, {
    unitCode: data.item.unitCode || "PCE"
  });

  addAmount(line, "LineExtensionAmount", netTotal, currency);

  const lineTax = line.ele("cac:TaxTotal");

addAmount(lineTax, "TaxAmount", vatTotal, currency);

// KSA-12: Invoice line amount including VAT
const lineGrossTotal = netTotal + vatTotal;

addAmount(
  lineTax,
  "RoundingAmount",
  lineGrossTotal,
  currency
);

  const item = line.ele("cac:Item");
  addText(item, "Name", data.item.name);

  const lineCategory = item.ele("cac:ClassifiedTaxCategory");

  addText(lineCategory, "ID", data.item.vatCategory || "S");
  addText(lineCategory, "Percent", vatRate);

  const lineTaxScheme = lineCategory.ele("cac:TaxScheme");
  addText(lineTaxScheme, "ID", "VAT");

  const price = line.ele("cac:Price");
  addAmount(price, "PriceAmount", unitPrice, currency);

  return root.end({ prettyPrint: true });
}