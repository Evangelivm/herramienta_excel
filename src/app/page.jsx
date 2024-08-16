import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "./navbar";
import Excelfile from "./excelfile";

function Dashboard() {
  return (
    <div className="flex min-h-screen  flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 h-screen justify-start items-center">
        <div className="grid gap-4 md:gap-8 ">
          <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Subir Archivo de Excel</CardTitle>
                <CardDescription>
                  Se procesara la informacion del archivo.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Excelfile />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
