import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, FileText, Flag, Trash2, Ban, CheckCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useStore, select, materials, users, reports } from "@/services/store";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminPanel() {
  useEffect(() => {
    materials.loadAll();
    users.loadAll();
    reports.loadAll();
  }, []);

  const mats = useStore(select.materials);
  const us = useStore(select.users);
  const reps = useStore(select.reports);

  const stats = [
    { label: "Users", value: us.length, icon: Users },
    { label: "Uploads", value: mats.length, icon: FileText },
    { label: "Open reports", value: reps.filter((r) => r.status === "open").length, icon: Flag },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><ShieldCheck className="text-primary" /> Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, content and reports.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
              <s.icon className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="uploads">
        <TabsList>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">
            Reports <Badge variant="destructive" className="ml-1">{reps.filter((r) => r.status === "open").length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploads">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">All uploads</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mats.slice(0, 15).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        <Link to={`/material/${m.id}`} className="hover:text-primary">{m.title}</Link>
                      </TableCell>
                      <TableCell>{m.subject}</TableCell>
                      <TableCell>{m.uploaderName}</TableCell>
                      <TableCell>{format(new Date(m.uploadedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={async () => {
                            await materials.removeIfAllowed(m.id);
                            toast({ title: "Material removed", description: m.title });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-base">Manage users</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Uploads</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {us.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.uploadCount}</TableCell>
                      <TableCell>
                        {u.role === "admin" ? (
                          <Badge variant="default" className="bg-primary"><Shield className="h-3 w-3 mr-1" /> Admin</Badge>
                        ) : (
                          <Badge variant="outline">Student</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.blocked ? <Badge variant="destructive">Blocked</Badge> : <Badge variant="secondary">Active</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await users.makeAdmin(u.id);
                                toast({ title: "Admin granted", description: `${u.name} is now an admin` });
                              }}
                            >
                              <Shield className="h-4 w-4 mr-1" /> Make Admin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={u.blocked ? "outline" : "ghost"}
                            className={u.blocked ? "text-success" : "text-destructive"}
                            onClick={async () => {
                              await users.toggleBlock(u.id);
                              toast({ title: u.blocked ? "User unblocked" : "User blocked", description: u.name });
                            }}
                          >
                            {u.blocked
                              ? <><CheckCircle className="h-4 w-4" /> Unblock</>
                              : <><Ban className="h-4 w-4" /> Block</>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Recent reports
                <Button asChild variant="link" size="sm"><Link to="/admin/reports">View all</Link></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reps.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b last:border-0 py-2">
                  <div>
                    <div className="font-medium text-sm">{r.materialTitle}</div>
                    <div className="text-xs text-muted-foreground">by {r.reporterName} · {r.reason}</div>
                  </div>
                  <Badge variant={r.status === "open" ? "destructive" : "secondary"}>{r.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
