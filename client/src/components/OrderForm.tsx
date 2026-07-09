import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface OrderItem {
  productId: number;
  quantity: string;
  rate: string;
}

interface OrderFormProps {
  order?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const [customerId, setCustomerId] = useState(0);
  const [status, setStatus] = useState("Pending");
  const [checkedBy, setCheckedBy] = useState("");
  const [receiver, setReceiver] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: 0, quantity: "", rate: "" }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: deliveryNumber } = trpc.orders.generateDeliveryNumber.useQuery();

  const createMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      toast.success("Order created successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to create order");
      setIsSubmitting(false);
    },
  });

  const updateMutation = trpc.orders.update.useMutation({
    onSuccess: () => {
      toast.success("Order updated successfully");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to update order");
      setIsSubmitting(false);
    },
  });

  // Calculate total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
    setTotalAmount(total);
  }, [items]);

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index].rate = product.rate.toString();
      setItems(newItems);
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string) => {
    const newItems = [...items];
    const item = newItems[index];
    if (field === "productId") {
      item.productId = parseInt(value);
    } else {
      item[field] = value;
    }
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: 0, quantity: "", rate: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (items.length === 0 || items.some(item => !item.productId || !item.quantity)) {
      toast.error("Please add at least one item with product and quantity");
      return;
    }

    setIsSubmitting(true);

    if (order) {
      updateMutation.mutate({
        id: order.id,
        data: {
          status: status as any,
          remarks,
          checkedBy,
          receiver,
          totalAmount: totalAmount.toString(),
        },
      });
    } else {
      createMutation.mutate({
        deliveryNumber: deliveryNumber || `DM-2026-000001`,
        customerId,
        remarks,
        checkedBy,
        receiver,
        status: status as any,
        totalAmount: totalAmount.toString(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
      {/* Customer Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer *</label>
        <Select value={customerId.toString()} onValueChange={(val) => setCustomerId(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name} ({customer.companyName || "N/A"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order Items */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Order Items *</label>
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-end">
            <Select
              value={item.productId.toString()}
              onValueChange={(val) => {
                handleItemChange(index, "productId", val);
                handleProductChange(index, parseInt(val));
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              step="0.01"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
              className="w-24"
            />

            <Input
              type="number"
              step="0.01"
              placeholder="Rate"
              value={item.rate}
              disabled
              className="w-24"
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(index)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Total Amount Display */}
      <div className="bg-muted p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount:</span>
          <span className="text-lg font-bold">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Status and Other Fields */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Packed">Packed</SelectItem>
            <SelectItem value="Dispatched">Dispatched</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Checked By</label>
        <Input
          placeholder="Name of person who checked"
          value={checkedBy}
          onChange={(e) => setCheckedBy(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Receiver</label>
        <Input
          placeholder="Name of receiver"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Remarks</label>
        <Textarea
          placeholder="Additional remarks..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
          {order ? "Update" : "Create"} Order
        </Button>
      </div>
    </form>
  );
}
