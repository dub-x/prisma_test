import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";

export default async function BookApi(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        if (req.query.id)
          return res
            .status(200)
            .json(
              await prisma.book.findFirst({
                where: { id: req.query.id as string },
              })
            );
        return res.status(200).json(await prisma.book.findMany());

      case "POST":
        const savedBook: Prisma.BookCreateInput = await prisma.book.create({
          data: req.body,
        });
        return res.status(201).json(savedBook);

      case "PUT":
        const updatedBook: Prisma.BookUpdateInput = await prisma.book.update({
          where: {
            id: req.body.id,
          },
          data: req.body,
        });
        return res.status(201).json(updatedBook);

      case "DELETE":
        const id = req.query.id as string;
        if (!id)
          return res.status(400).json({ message: "You should have an id!" });
        const book = await prisma.book.delete({
          where: { id },
        });
        return res.status(200).json(book);

      default:
        return res.status(405).json({ message: "Method not allowed!" });
    }
  } catch (e: any) {
    return res.status(400).json({ message: "Something went wrong", ...e.meta });
  }
}
