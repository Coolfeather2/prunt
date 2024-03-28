import {
	json,
	type LoaderFunctionArgs,
} from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { DataTable } from '#app/components/data-table'
import { Button } from '#app/components/ui/button'
import { toHeaderCase } from '#app/utils/misc'

interface Material {
	MaterialID: string
	CategoryName: string
	CategoryID: string
	Name: string
	Ticker: string
	Weight: number
	Volume: number
	UserNameSubmitted: string
	Timestamp: string
}

interface Exchange {
	MaterialTicker: string
	ExchangeCode: string
	MMBuy: number | null
	MMSell: number | null
	PriceAverage: number
	AskCount: number | null
	Ask: number | null
	Supply: number
	BidCount: number | null
	Bid: number | null
	Demand: number
}

export const columns: ColumnDef<Material>[] = [
	{
		accessorKey: 'CategoryName',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Category
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
	},
	{
		accessorKey: 'Ticker',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Ticker
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
	},
	{
		accessorKey: 'Name',
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Material
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			)
		},
	},
	{
		accessorKey: 'exchange',
		header: 'Exchange',
		cell: props => {
			const value = props.cell.getValue() as Exchange[] | null
			if (!Array.isArray(value)) {
				// Handle the case where value is not an array
				return null // or some default JSX
			}
			return value.map((ex: Exchange) => {
				return (
					<>
						<p>EX: {ex.ExchangeCode}</p>
						<p>Price Average: {ex.PriceAverage}</p>
						<p>Bid: {ex.Bid}</p>
						<p>Bid Qty: {ex.BidCount}</p>
						<p>Ask: {ex.Ask}</p>
						<p>Ask Qty: {ex.AskCount}</p>
						{ex.MMBuy ? <p>Market Marker Buy: {ex.MMBuy}</p> : null}
						{ex.MMSell ? <p>Market Marker Sell: {ex.MMSell}</p> : null}
						<p>Supply: {ex.Supply}</p>
						<p>Demand: {ex.Demand}</p>
						<hr />
					</>
				)
			})
		},
	},
]

export async function loader({ request, params }: LoaderFunctionArgs) {
  const category = params.category

	const resMat = await fetch(
		category !== 'all'
			? `https://rest.fnar.net/material/category/${category}`
			: 'https://rest.fnar.net/material/allmaterials',
	)
	const resEx = await fetch('https://rest.fnar.net/exchange/all')

	const resMatJson = (await resMat.json()) as Material[]
	const resExJson = (await resEx.json()) as Exchange[]

	const materials = resMatJson.map((material: Material) => {
		return {
			MaterialID: material.MaterialID,
			CategoryName: toHeaderCase(material.CategoryName),
			CategoryID: material.CategoryID,
			Name: toHeaderCase(material.Name),
			Ticker: material.Ticker,
			Weight: material.Weight,
			Volume: material.Volume,
			UserNameSubmitted: material.UserNameSubmitted,
			Timestamp: material.Timestamp,
			exchange: resExJson.filter(ex => ex.MaterialTicker === material.Ticker),
		}
	})

	return json(materials)
}


export default function StockCategory() {
	const materials = useLoaderData<typeof loader>()
	return (
		<div className="mx-5 mx-auto">
			<p className="m-3">Hold shift to sort multiple at once.</p>
			<DataTable columns={columns} data={materials} />
		</div>
	)
}
