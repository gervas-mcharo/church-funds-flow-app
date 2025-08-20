import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Building, 
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MessageSquare
} from "lucide-react";
import { useEnhancedMoneyRequests, type EnhancedMoneyRequest } from "@/hooks/useEnhancedMoneyRequests";
import { useDepartments } from "@/hooks/useDepartments";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApprovalChainViewer } from "./ApprovalChainViewer";
import { Textarea } from "@/components/ui/textarea";
import { useAddRequestComment } from "@/hooks/useEnhancedMoneyRequests";
import { Label } from "@/components/ui/label";

interface MoneyRequestFilters {
  status?: string[];
  department_id?: string;
  priority?: string[];
  search_term?: string;
}

export function EnhancedMoneyRequestsList() {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const [filters, setFilters] = useState<MoneyRequestFilters>({});
  const [selectedRequest, setSelectedRequest] = useState<EnhancedMoneyRequest | null>(null);
  const [newComment, setNewComment] = useState("");
  
  const { data: requests, isLoading } = useEnhancedMoneyRequests(filters);
  const { data: departments } = useDepartments();
  const addComment = useAddRequestComment();

  const statusOptions = [
    'submitted',
    'pending_treasurer_approval',
    'pending_hod_approval', 
    'pending_finance_elder_approval',
    'pending_general_secretary_approval',
    'pending_pastor_approval',
    'approved',
    'rejected',
    'paid'
  ];

  const priorityOptions = ['low', 'medium', 'high', 'urgent'];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending_treasurer_approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_hod_approval': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pending_finance_elder_approval': 'bg-orange-100 text-orange-800 border-orange-200',
      'pending_general_secretary_approval': 'bg-purple-100 text-purple-800 border-purple-200',
      'pending_pastor_approval': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'approved': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'paid': 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-blue-100 text-blue-800 border-blue-200',
      'medium': 'bg-green-100 text-green-800 border-green-200',
      'high': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'urgent': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="h-4 w-4" />;
    if (status === 'rejected') return <XCircle className="h-4 w-4" />;
    if (status.includes('pending')) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const myRequests = useMemo(() => {
    return requests?.filter(req => req.requester_id === user?.id) || [];
  }, [requests, user?.id]);

  const pendingApprovals = useMemo(() => {
    if (!requests || !userRole) return [];
    return requests.filter(req => {
      const currentStep = req.approval_chain?.find(step => 
        step.is_approved === null && 
        step.approver_role === userRole
      );
      return !!currentStep;
    });
  }, [requests, userRole]);

  const allAccessibleRequests = useMemo(() => {
    if (!requests) return [];
    
    // Admins, finance roles see all
    const canSeeAll = ['administrator', 'finance_administrator', 'finance_elder', 'general_secretary', 'pastor'].includes(userRole || '');
    if (canSeeAll) return requests;
    
    // Department members see their department's requests
    return requests.filter(req => 
      req.requester_id === user?.id
    );
  }, [requests, userRole, user]);

  const handleAddComment = async () => {
    if (!selectedRequest || !newComment.trim()) return;
    
    await addComment.mutateAsync({
      requestId: selectedRequest.id,
      comment: newComment,
      isInternal: false
    });
    
    setNewComment("");
  };

  const canUserApprove = (request: EnhancedMoneyRequest) => {
    if (!userRole) return false;
    
    const hasApprovalRole = ['administrator', 'treasurer', 'head_of_department', 'finance_elder', 'general_secretary', 'pastor'].includes(userRole);
    const hasUnprocessedStep = request.approval_chain?.some(step => 
      step.is_approved === null && step.approver_role === userRole
    );
    
    return hasApprovalRole && hasUnprocessedStep;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const RequestCard = ({ request }: { request: EnhancedMoneyRequest }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(request.status)} variant="outline">
                {getStatusIcon(request.status)}
                {request.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <Badge className={getPriorityColor(request.priority || 'medium')} variant="outline">
                {(request.priority || 'medium').toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {request.requesting_department?.name}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {request.requester?.first_name} {request.requester?.last_name}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(request.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <DollarSign className="h-6 w-6" />
              {request.amount.toLocaleString()}
            </div>
            {request.fund_type && (
              <p className="text-sm text-muted-foreground">{request.fund_type.name}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Purpose:</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{request.purpose}</p>
        </div>
        
        {request.suggested_vendor && (
          <div className="mt-2">
            <p className="text-sm"><strong>Vendor:</strong> {request.suggested_vendor}</p>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {request.attachments && request.attachments.length > 0 && (
              <Badge variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                {request.attachments.length} file(s)
              </Badge>
            )}
            {request.comments && request.comments.length > 0 && (
              <Badge variant="outline">
                <MessageSquare className="h-3 w-3 mr-1" />
                {request.comments.length} comment(s)
              </Badge>
            )}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setSelectedRequest(request)}>
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Details - ${request.amount.toLocaleString()}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <p>{request.requesting_department?.name}</p>
                  </div>
                  <div>
                    <Label>Requester</Label>
                    <p>{request.requester?.first_name} {request.requester?.last_name}</p>
                  </div>
                  <div>
                    <Label>Fund Type</Label>
                    <p>{request.fund_type?.name}</p>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Badge className={getPriorityColor(request.priority || 'medium')} variant="outline">
                      {(request.priority || 'medium').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Purpose</Label>
                  <p className="mt-1">{request.purpose}</p>
                </div>
                
                {request.approval_chain && (
                  <ApprovalChainViewer 
                    approvalChain={request.approval_chain} 
                    requestId={request.id}
                    canApprove={canUserApprove(request)}
                  />
                )}
                
                {/* Comments Section */}
                <div className="space-y-4">
                  <Label>Comments</Label>
                  {request.comments?.map((comment) => (
                    <div key={comment.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {comment.user?.first_name} {comment.user?.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))}
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addComment.isPending}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-10"
                  value={filters.search_term || ""}
                  onChange={(e) => setFilters(prev => ({ ...prev, search_term: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status?.[0] || "all"}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value === "all" ? undefined : [value] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Department</Label>
              <Select
                value={filters.department_id || "all"}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  department_id: value === "all" ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select
                value={filters.priority?.[0] || "all"}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  priority: value === "all" ? undefined : [value] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Lists */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Requests ({allAccessibleRequests.length})</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests ({myRequests.length})</TabsTrigger>
          <TabsTrigger value="pending-approvals">
            Pending My Approval ({pendingApprovals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allAccessibleRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No requests found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            allAccessibleRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">You haven't submitted any requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            myRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending-approvals" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No requests pending your approval.</p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}