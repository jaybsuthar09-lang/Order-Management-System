import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Search, Download } from "lucide-react";
import { toast } from "sonner";
import OrderForm from "@/components/OrderForm";

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Packed: "bg-blue-100 text-blue-800",
  Dispatched: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders = [], isLoading, refetch } = trpc.orders.list.useQuery({
    search: searchTerm || undefined,
  });

  const deleteOrderMutation = trpc.orders.delete.useMutation({
    onSuccess: () => {
      toast.success("Order deleted successfully");
      refetch();
    },
    onError: () => {
      toast.error("Failed to delete order");
    },
  });

  const generatePDFMutation = trpc.orders.generatePDF.useMutation();

  const handleDownloadPDF = async (orderId: number, deliveryNumber: string) => {
    try {
      const result = await generatePDFMutation.mutateAsync({ orderId });
      if (result.success && result.pdf) {
        // Decode base64 and create blob
        const binaryString = atob(result.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${deliveryNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("PDF downloaded successfully");
      }
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage delivery memos and orders</p>
        </div>
        <Button
          onClick={() => {
            setSelectedOrder(null);
            setIsFormOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>Total orders: {orders.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by delivery number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.deliveryNumber}</TableCell>
                      <TableCell>{order.customerName || "-"}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{parseFloat(order.totalAmount || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download PDF"
                            onClick={() => handleDownloadPDF(order.id, order.deliveryNumber)}
                            disabled={generatePDFMutation.isPending}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
            <DialogDescription>
              {selectedOrder
                ? "Update order details"
                : "Create a new delivery memo"}
            </DialogDescription>
          </DialogHeader>
          <OrderForm
            order={selectedOrder}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
