import { type MetaFunction } from '@remix-run/node'
import { Outlet, Link, useLocation } from '@remix-run/react'
import { Button } from '#app/components/ui/button'

export const meta: MetaFunction = () => [{ title: 'Stock Exchange' }]

export default function Index() {
	const category = useLocation().pathname.split('/').pop()
	const variant = category === 'all' ? 'default' : 'outline'

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
		<>
			<div className='justify-between gap-2 mx-5 grid xl:grid-cols-8 md:grid-cols-4 grid-cols-2 mx-auto'>
				<Button asChild variant={variant || 'outline'}>
					<Link to="./all" preventScrollReset={true} >All</Link>
				</Button>
				<div className='col-span-full'/>
				{categoryList.map(category => (
					<CategoryButton key={category} category={category} />
				))}
			</div>
			<Outlet />
		</>
	)
}

/**
 * CategoryButton is a React component that renders a button. The variant of the button is determined by comparing the `category` prop to the `categoryURL` prop. If they're equal, the variant is 'default'. Otherwise, the variant is 'outline'.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.category - The category to display on the button. This is used to determine the variant of the button.
 * @returns {JSX.Element} A JSX element that represents a button.
 *
 * @example
 * <CategoryButton
 *     category={category}
 * />
 */
function CategoryButton({
	category, //The category to display on the button
	...props
}: {
	category: string
}): JSX.Element {
	//convert the category to a valid url link
	const categoryLink = category.replace(/ /g, '+')
	
	const categoryURL = useLocation().pathname.split('/').pop()
	const variant = categoryLink === categoryURL ? 'default' : 'outline'

	return (
		<Button asChild  className="grow" variant={variant} {...props}>
			<Link to={`./${categoryLink}`} preventScrollReset={true} >{category}</Link>
		</Button>
	)
}
