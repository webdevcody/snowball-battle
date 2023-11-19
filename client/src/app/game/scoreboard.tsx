"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Score } from "./page";
import clsx from "clsx";
import { christmasFontNormal } from "../fonts";

export function ScoreBoard({
  scores,
  myPlayerId,
}: {
  scores: Score[];
  myPlayerId: string;
}) {
  const sortedScores = scores.sort((a, b) => b.kills - a.kills);

  const columns: ColumnDef<Score>[] = [
    {
      accessorKey: "nickname",
      header: "Player",
      cell(value) {
        return (
          <span
            className={clsx({
              "text-red-500": myPlayerId === value.row.original.player,
            })}
          >
            {(value.getValue() as string).substring(0, 14)}
          </span>
        );
      },
    },
    {
      accessorKey: "kills",
      header: "Kills",
    },
    {
      accessorKey: "deaths",
      header: "Deaths",
    },
  ];

  const table = useReactTable({
    data: sortedScores,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {},
  });

  return (
    <div className="w-full pointer-events-none">
      <div className="rounded-md border bg-white text-black">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-black p-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
