import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Form, useLoaderData, useSearchParams } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { DataTable } from '#app/components/data-table'
import { Button } from '#app/components/ui/button'
import { toHeaderCase } from '#app/utils/misc'

export const meta: MetaFunction = () => [{ title: 'Prun Tools' }]

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
			const value = props.cell.getValue() as Exchange[] | null;
			if (!Array.isArray(value)) {
				// Handle the case where value is not an array
				return null; // or some default JSX
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
	const categoryFilter = new URL(request.url).searchParams.get('category')

	const resMat = await fetch(
		categoryFilter
			? `https://rest.fnar.net/material/category/${categoryFilter}`
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

export default function Index() {
	const materials = useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const categoryURL = searchParams.get('category')

	const categoryList = [
		'Agricultural Products',
		'Alloys',
		'Chemicals',
		'Construction Materials',
		'Construction Parts',
		'Construction Prefabs',
		'Consumables Basic',
		'Consumables Luxury',
		'Drones',
		'Electronic Devices',
		'Electronic Parts',
		'Electronic Pieces',
		'Electronic Systems',
		'Elements',
		'Energy Systems',
		'Fuels',
		'Gases',
		'Liquids',
		'Medical Equipment',
		'Metals',
		'Minerals',
		'Plastics',
		'Ship Engines',
		'Ship Kits',
		'Ship Parts',
		'Ship Shields',
		'Software Components',
		'Software Systems',
		'Software Tools',
		'Textiles',
		'Unit Prefabs',
		'Utility',
	
	]

	return (
		<Form>
			<Button
				variant={searchParams.has('category') ? 'outline' : 'default'}
				value=''
			>
				All
			</Button>
			<hr/>
			{categoryList.map(category => (
				<CategoryButton
					key={category}
					category={category}
					categoryURL={categoryURL}
				/>
			))

			}
			<hr/>
			<p>Hold shift to sort multiple at once.</p>
			<hr/>
			<DataTable columns={columns} data={materials} />
		</Form>
	);
}

/**
 * CategoryButton is a React component that renders a button. The variant of the button is determined by comparing the `category` prop to the `categoryURL` prop. If they're equal, the variant is 'default'. Otherwise, the variant is 'outline'.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.category - The category to display on the button. This is used to determine the variant of the button.
 * @param {string | null} props.categoryURL - The current category on the URL. This is used to determine the variant of the button.
 * @returns {JSX.Element} A JSX element that represents a button.
 *
 * @example
 * <CategoryButton
 *     category={category}
 *     categoryURL={categoryURL}
 * />
 */
function CategoryButton({
		category, //The category to display on the button
		categoryURL, //The current category on the URL
		...props
	}: {
		category: string,
		categoryURL: string | null,
	}): JSX.Element {
	const variant = category === categoryURL ? 'default' : 'outline'
	return (
		<Button
			variant={variant}
			{...props}
			name="category"
			value={category}
		>
			{category}
		</Button>
	)
}
