import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import { type ColumnDef } from '@tanstack/react-table'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { ArrowUpDown } from 'lucide-react'
import { toHeaderCase } from '#app/utils/misc'
import { DataTable } from '#app/components/data-table'
import { Button } from '#app/components/ui/button'
import { Children, useState } from 'react'

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
	Timestamp: string
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
]

export async function loader({ request, params }: LoaderFunctionArgs) {
	const categoryFilter = new URL(request.url).searchParams.get('category')

	const res = await fetch(
		categoryFilter
			? `https://rest.fnar.net/material/category/${categoryFilter}`
			: 'https://rest.fnar.net/material/allmaterials',
	)
	const resJson = (await res.json()) as Material[]

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
			Timestamp: material.Timestamp,
		}
	})

	return json(materials)
}

export default function Index() {
	const materials = useLoaderData<typeof loader>()
	const [searchParams, setSearchParams] = useSearchParams()

	return (
		<>
			<Button
				variant={searchParams.has('category') ? 'outline' : 'default'}
				onClick={e => {
					e.preventDefault()
					setSearchParams(prev => {
						prev.delete('category')
						return prev
					})
				}}
			>
				All
			</Button>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Agricultural Products
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Alloys
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Chemicals
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Construction Materials
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Construction Parts
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Construction Prefabs
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Consumables Basic
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Consumables Luxury
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Drones
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Electronic Devices
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Electronic Parts
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Electronic Pieces
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Electronic Systems
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Elements
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Energy Systems
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Fuels
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Gases
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Liquids
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Medical Equipment
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Metals
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Minerals
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Plastics
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Ship Engines
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Ship Kits
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Ship Parts
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Ship Shields
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Software Components
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Software Systems
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Software Tools
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Textiles
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Unit Prefabs
			</CategoryButton>
			<CategoryButton
				searchParams={searchParams}
				setSearchParams={setSearchParams}
			>
				Utility
			</CategoryButton>
			<p>Hold shift to sort multiple at once.</p>
			<DataTable columns={columns} data={materials} />
		</>
	)
}

//create a button that changes variant if url param matches category
function CategoryButton({
	searchParams,
	setSearchParams,
	children,
	...props
}): JSX.Element {
	const category = children.toLowerCase()
	const categoryFilter = searchParams.get('category')
	const variant = categoryFilter === category ? 'default' : 'outline'
	return (
		<Button
			variant={variant}
			{...props}
			onClick={e => {
				e.preventDefault()
				setSearchParams(prev => {
					prev.set('category', category)
					return prev
				})
			}}
		>
			{children}
		</Button>
	)
}
