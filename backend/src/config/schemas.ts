class SchemaRegistry {
  private registries: { [docType: string]: string[] } = {
    Item: ['name', 'item_name', 'stock_uom', 'valuation_rate', 'standard_selling_rate', 'description'],
    Warehouse: ['name', 'warehouse_name', 'parent_warehouse', 'is_group'],
    Supplier: ['name', 'supplier_group', 'status', 'email_id', 'phone'],
    Customer: ['name', 'customer_group', 'status', 'email_id', 'mobile_no'],
    'Purchase Order': ['name', 'supplier', 'transaction_date', 'schedule_date', 'status', 'grand_total', 'total_qty'],
  };

  // Get field names as a JSON string array for ERPNext query
  public getFields(docType: string): string {
    const list = this.registries[docType] || ['name'];
    return JSON.stringify(list);
  }

  // Retrieve raw array list
  public getFieldsArray(docType: string): string[] {
    return this.registries[docType] || ['name'];
  }

  // Get all registered doc types
  public getDocTypes(): string[] {
    return Object.keys(this.registries);
  }

  // Dynamically register a new custom field for a DocType
  public registerField(docType: string, fieldName: string): boolean {
    if (!this.registries[docType]) {
      this.registries[docType] = ['name'];
    }

    if (!this.registries[docType].includes(fieldName)) {
      this.registries[docType].push(fieldName);
      console.log(`[Schema Registry] Registered custom field "${fieldName}" for DocType "${docType}"`);
      return true;
    }
    return false;
  }
}

export const schemaRegistry = new SchemaRegistry();
export default schemaRegistry;
