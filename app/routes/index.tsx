import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react';
import { type ColumnDef } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#app/components/ui/table';
import {toHeaderCase} from '#app/utils/misc';

export const meta: MetaFunction = () => [{ title: 'Epic Notes' }]

interface Material {
	MaterialID: string
	CategoryName: string
	CategoryID: string
	Name: string
	Ticker: string
	Weight: number
	Volume: number
	UserNameSubmitted: string
	Timestamp: Date
}

export const columns: ColumnDef<Material>[] = [
	{
	  accessorKey: "CategoryName",
	  header: "Category",
	},
	{
	  accessorKey: "Name",
	  header: "Material",
	},
  ]
  

export async function loader({ params }: LoaderFunctionArgs) {
	const res = await fetch("https://rest.fnar.net/material/allmaterials");
	const resJson = await res.json() as Material[];

	// map the json response to array of materials while typing it
	const materials: Material[] = resJson.map((material: Material) => {
		return {
			MaterialID: material.MaterialID,
			CategoryName: toHeaderCase(material.CategoryName),
			CategoryID: material.CategoryID,
			Name: toHeaderCase(material.Name),
			Ticker: material.Ticker,
			Weight: material.Weight,
			Volume: material.Volume,
			UserNameSubmitted: material.UserNameSubmitted,
			Timestamp: material.Timestamp
		}
	})



	return json(materials)
}


export default function Index() {
	const materials = useLoaderData<typeof loader>();
	return (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Category</TableHead>
						<TableHead>Material</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{materials.map((material) =>
					<TableRow key={material.MaterialID}>
						<TableCell>{material.CategoryName}</TableCell>
						<TableCell>{material.Name}</TableCell>
					</TableRow>
					)}
				</TableBody>
			</Table>
	)
}
