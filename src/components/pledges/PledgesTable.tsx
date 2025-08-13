import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHead,
  TableHeader,
  TableHeaderGroup,
  TableProvider,
  TableRow,
} from "@/components/ui/data-table";
import { useCurrencySettings } from "@/hooks/useCurrencySettings";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Target, User, Calendar } from "lucide-react";
import type { Pledge } from "@/hooks/usePledges";

interface PledgesTableProps {
  pledges: Pledge[];
  onView: (pledge: Pledge) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const PledgesTable = ({ pledges, onView }: PledgesTableProps) => {
  const { formatAmount } = useCurrencySettings();

  const columns: ColumnDef<Pledge>[] = [
    {
      accessorKey: "purpose",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Purpose" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.purpose}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.fund_types?.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contributor",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Contributor" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.original.contributors?.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.contributors?.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "pledge_amount",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-semibold">{formatAmount(row.original.pledge_amount)}</div>
          {row.original.total_paid > 0 && (
            <div className="text-sm text-muted-foreground">
              {formatAmount(row.original.total_paid)} paid
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "progress",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const progress = (row.original.total_paid / row.original.pledge_amount) * 100;
        return (
          <div className="w-24">
            <div className="flex justify-between text-sm mb-1">
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={getStatusColor(row.original.status)}
        >
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "start_date",
      header: ({ column }) => (
        <TableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.original.start_date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="rounded-md border">
      <TableProvider
        columns={columns}
        data={pledges}
        className="border-0"
      >
        <TableHeader>
          {({ headerGroup }) => (
            <TableHeaderGroup key={headerGroup.id} headerGroup={headerGroup}>
              {({ header }) => <TableHead key={header.id} header={header} />}
            </TableHeaderGroup>
          )}
        </TableHeader>
        <TableBody>
          {({ row }) => (
            <TableRow key={row.id} row={row}>
              {({ cell }) => <TableCell key={cell.id} cell={cell} />}
            </TableRow>
          )}
        </TableBody>
      </TableProvider>
    </div>
  );
};