"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-provider";
import { addUser, changeUserPassword, deleteUser, editUser, userList } from "@/lib/api";
import { ManagedUser } from "@shared/types/admin";
import { Check, Pencil, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Combobox } from "@/components/ui/Combobox";
import { Label } from "@/components/ui/label";

export default function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="bg-background text-foreground flex-grow flex items-center justify-center">
        <div className="space-y-4 flex justify-center flex-col">
          <h2 className="text-8xl text-center">403</h2>
          <h1 className="text-3xl font-semibold text-center">Forbidden</h1>
          <p className="text-sm text-muted-foreground">You are not authorized to access this page</p>
          <NavLink to="/" className={buttonVariants()}>
            Back to Home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="user" className="h-full w-full flex mt-4">
      <TabsList className="w-52 h-full flex flex-col gap-1 shrink-0 justify-start">
        <TabsTrigger value="user" className="w-full">
          User
        </TabsTrigger>
        <TabsTrigger value="show" className="w-full">
          Show
        </TabsTrigger>
      </TabsList>

      <Card className="py-2 px-5 w-full h-full ml-3">
        <TabsContent value="user">
          <UserPage />
        </TabsContent>

        <TabsContent value="show">
          <ShowPage />
        </TabsContent>
      </Card>
    </Tabs>
  );
}

function UserPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");

  const limit = 10;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true); // Tracks if more data is available
  const [loading, setLoading] = useState(false); // Tracks loading state

  const loadUsers = async (newOffset: number) => {
    setLoading(true);
    try {
      const res = await userList({
        offset: newOffset,
        limit: limit,
        query: query,
      });
      if (res.users) {
        setUsers((prev) => [...prev, ...res.users!]);
        setHasMore(res.users.length === limit); // Check if more data is available
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const reloadUsers = () => {
    setUsers([]);
    setOffset(0);
    loadUsers(0);
  };

  useEffect(() => {
    loadUsers(0);
  }, []);

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    loadUsers(newOffset);
  };

  const columns: ColumnDef<ManagedUser>[] = [
    {
      accessorKey: "username",
      header: "Username",

      cell: ({ row }) => {
        const [editing, setEditing] = useState(false);
        const [newUsername, setNewUsername] = useState(row.original.username);

        return (
          <div>
            <div className="flex gap-1 items-center">
              {editing ? (
                <Input
                  type="text"
                  autoComplete="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                />
              ) : (
                <div>{row.getValue("username")}</div>
              )}

              {editing ? (
                <>
                  <button
                    className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    onClick={() => {
                      const newUser = row.original;
                      newUser.username = newUsername;

                      editUser({ user: newUser }).then((res) => {
                        if (res.success) {
                          setUsers((prev) => prev.map((u) => (u.id === newUser.id ? newUser : u)));
                          setEditing(false);
                        }
                      });
                    }}
                  >
                    <Check className="w-full h-full" />
                  </button>
                  <button
                    className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    onClick={() => {
                      setEditing(false);
                      setNewUsername(row.original.username);
                    }}
                  >
                    <X className="w-full h-full" />
                  </button>
                </>
              ) : (
                <button
                  className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="w-full h-full" />
                </button>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "mail",
      header: "Email",
      cell: ({ row }) => {
        const [editing, setEditing] = useState(false);
        const [newMail, setNewMail] = useState(row.original.mail);

        return (
          <div>
            <div className="flex gap-1 items-center">
              {editing ? (
                <Input
                  type="text"
                  autoComplete="username"
                  value={newMail}
                  onChange={(e) => setNewMail(e.target.value)}
                />
              ) : (
                <div>{row.getValue("mail")}</div>
              )}

              {editing ? (
                <>
                  <button
                    className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    onClick={() => {
                      const newUser = row.original;
                      newUser.mail = newMail;

                      editUser({ user: newUser }).then((res) => {
                        if (res.success) {
                          setUsers((prev) => prev.map((u) => (u.id === newUser.id ? newUser : u)));
                          setEditing(false);
                        }
                      });
                    }}
                  >
                    <Check className="w-full h-full" />
                  </button>
                  <button
                    className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                    onClick={() => {
                      setEditing(false);
                      setNewMail(row.original.mail);
                    }}
                  >
                    <X className="w-full h-full" />
                  </button>
                </>
              ) : (
                <button
                  className="rounded-full h-5 w-5 p-1 hover:bg-accent disabled:opacity-50 disabled:pointer-events-none shrink-0"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="w-full h-full" />
                </button>
              )}
            </div>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "role",
      header: "Role",

      cell: ({ row }) => (
        <div>
          <Combobox
            mandatory
            disableSearch
            value={row.getValue("role")}
            elements={[
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
            onChange={(value) => {
              const newUser = row.original;
              newUser.role = value;

              editUser({ user: newUser }).then((res) => {
                if (res.success) {
                  setUsers((prev) => prev.map((u) => (u.id === newUser.id ? newUser : u)));
                }
              });
            }}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const [newPwd, setNewPwd] = useState("");

        return (
          <div className="h-full flex items-center justify-end gap-2">
            <div className="flex gap-1">
              <Input
                type="password"
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <Button
                disabled={!newPwd}
                onClick={() => {
                  changeUserPassword({
                    user_id: user.id,
                    new_password: newPwd,
                  }).then((res) => {
                    if (res.success) {
                      setNewPwd("");
                      alert("Password changed successfully");
                    }
                  });
                }}
              >
                Change Pwd
              </Button>
            </div>
            <Button
              size={"icon"}
              variant={"destructive"}
              onClick={() => {
                deleteUser({ user_id: user.id }).then((res) => {
                  if (res.success) {
                    setUsers((prev) => prev.filter((u) => u.id !== user.id));
                  }
                });
              }}
            >
              <X />
            </Button>
          </div>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const [newUser, setNewUser] = useState<ManagedUser>({
    username: "",
    mail: "",
    role: "user",
    password: "",
    id: -1,
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between h-full">
        <div className="flex gap-4 items-center">
          <h2 className="text-2xl font-semibold">Users</h2>
          <div className="relative">
            <Input
              id="input-26"
              className="peer ps-9"
              placeholder="Search by username..."
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <Search size={16} strokeWidth={2} />
            </div>
          </div>
          <Button
            onClick={() => {
              reloadUsers();
            }}
          >
            Search
          </Button>

          <div className="text-muted-foreground text-sm">The account you are logged in as is not visible in this list.</div>
        </div>
      </div>

      <ScrollArea className="h-[40rem] pr-4">
        <div className="flex flex-col gap-2">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="dark:hover:backdrop-brightness-105 hover:backdrop-brightness-90"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="p-0 pl-2">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="dark:hover:backdrop-brightness-105 hover:backdrop-brightness-90"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="py-2" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {hasMore && (
            <Button variant={"outline"} className="self-center mt-4" onClick={handleLoadMore} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </Button>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-1 items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-username">Username</Label>
          <Input
            id="admin-username"
            type="text"
            autoComplete="new-password"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-mail">Mail</Label>
          <Input
            id="admin-mail"
            type="email"
            autoComplete="new-password"
            value={newUser.mail}
            onChange={(e) => setNewUser({ ...newUser, mail: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="new-password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="admin-role">Role</Label>
          <Combobox
            id="admin-role"
            className="shrink-0"
            mandatory
            disableSearch
            value={newUser.role}
            elements={[
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
            onChange={(value) => {
              setNewUser({ ...newUser, role: value });
            }}
          />
        </div>
        <Button
          disabled={!newUser.username || !newUser.mail || !newUser.password}
          onClick={() => {
            addUser({ user: newUser }).then((res) => {
              if (res.user) {
                setUsers([...users, res.user]);
                setNewUser({ username: "", mail: "", role: "user", password: "", id: -1 });
              }
            });
          }}
        >
          Add user
        </Button>
      </div>
    </div>
  );
}

function ShowPage() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-2xl font-semibold">Shows</h2>
    </div>
  );
}
