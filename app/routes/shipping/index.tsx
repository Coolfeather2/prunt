import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import {
	Form,
	type MetaFunction,
	useLoaderData,
	useSearchParams,
	useRouteError,
	isRouteErrorResponse,
	Link,
} from '@remix-run/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary'
import { Field } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Card } from '#app/components/ui/card'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '#app/components/ui/collapsible'
import { Progress } from '#app/components/ui/progress'
import { Separator } from '#app/components/ui/separator'
import { StatusButton } from '#app/components/ui/status-button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { getUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { useIsPending } from '#app/utils/misc'

const UsernameFormSchema = z.object({
	username: z.string(),
})
dayjs.extend(utc)
dayjs.extend(relativeTime)

interface Ship {
	RepairMaterials: ShipRepairMaterials[]
	AddressLines: ShipAddressLine[]
	ShipId: string
	StoreId: string
	StlFuelStoreId: string
	FtlFuelStoreId: string
	Registration: string
	Name: string
	CommissioningTimeEpochMs: number
	BlueprintNaturalId: string
	FlightId: string | null
	Acceleration: number
	Thrust: number
	Mass: number
	OperatingEmptyMass: number
	ReactorPower: number
	EmitterPower: number
	Volume: number
	Condition: number
	LastRepairEpochMs: number | null
	Location: string
	StlFuelFlowRate: number
	UserNameSubmitted: string
	Timestamp: string
}

interface ShipRepairMaterials {
	ShipRepairMaterialId: string
	MaterialName: string
	MaterialId: string
	MaterialTicker: string
	Amount: number
}

interface ShipAddressLine {
	LineType: string
	LineId: string
	NaturalId: string
	LineName: string
}

interface Flight {
	Segments: FlightSegment[]
	FlightId: string
	ShipId: string
	Origin: string
	Destination: string
	DepartureTimeEpochMs: number
	ArrivalTimeEpochMs: number
	CurrentSegmentIndex: number
	StlDistance: number
	FtlDistance: number
	IsAborted: boolean
	UsernameSubmitted: string
	Timestamp: string
}

interface FlightSegment {
	OriginLines: FlightLine[]
	DestinationLines: FlightLine[]
	Type: string
	DepartureTimeEpochMs: number
	ArrivalTimeEpochMs: number
	StlDistance: number | null
	StlFuelConsumption: number | null
	FtlDistance: number | null
	FtlFuelConsumption: number | null
	Origin: string
	Destination: string
}

interface FlightLine {
	Type: string
	LineId: string
	LineNaturalId: string
	LineName: string
}

export async function loader({ request }: LoaderFunctionArgs) {
	const usernameFilter = new URL(request.url).searchParams.get('username')
	if (usernameFilter !== null) {
		const userId = await getUserId(request)
		const user = userId
			? await prisma.user.findUniqueOrThrow({
					where: { id: userId },
					select: { FIOApiKey: true },
				})
			: null

		const resShips = await fetch(
			`https://rest.fnar.net/ship/ships/${usernameFilter}`,
			{
				headers: {
					Authorization: `${user?.FIOApiKey || process.env.FIO_API_KEY}`,
				},
			},
		)
		if (!resShips.ok) {
			throw json(null, { status: resShips.status })
		}
		const resflights = await fetch(
			`https://rest.fnar.net/ship/flights/${usernameFilter}`,
			{
				headers: {
					Authorization: `${user?.FIOApiKey || process.env.FIO_API_KEY}`,
				},
			},
		)
		//handle fetch errors only return on 200
		if (!resflights.ok) {
			//return status code to client as http status code
			throw json(null, { status: resflights.status })
		}

		const resFlightsJson = (await resflights.json()) as Flight[]
		const resShipsJson = (await resShips.json()) as Ship[]
		return json({ flights: resFlightsJson, ships: resShipsJson })
	}
	return null
}

/* calculate progress percentage between two epoch dates from flights */
function calculateProgress(flight: Flight) {
	const now = Date.now()
	const departure = flight.DepartureTimeEpochMs
	const arrival = flight.ArrivalTimeEpochMs
	const progress = ((now - departure) / (arrival - departure)) * 100
	return progress
}

export default function Shipping() {
	const data = useLoaderData<typeof loader>()
	const isPending = useIsPending()
	const [searchParams] = useSearchParams()
	const usernameURL = searchParams.get('username')

	const [form, fields] = useForm({
		id: 'username',
		constraint: getZodConstraint(UsernameFormSchema),
		defaultValue: { username: usernameURL },
		// lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: UsernameFormSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div>
			<Form className="m-5 max-w-md" method="GET" {...getFormProps(form)}>
				<Field
					className="m-1"
					labelProps={{ children: 'Username' }}
					inputProps={{
						...getInputProps(fields.username, { type: 'text' }),
						className: 'lowercase',
					}}
					errors={fields.username.errors}
				/>
				<StatusButton
					status={isPending ? 'pending' : form.status ?? 'idle'}
					type="submit"
					disabled={isPending}
				>
					Submit
				</StatusButton>
			</Form>
			<div className="m-3">
				<p>
					Public data by default, create a user and save your API key to fetch
					data available to you.
				</p>
				<p>Data may be stale from FIO.</p>
			</div>
			<hr />
			<h2 className="m-3 text-xl">Active Flights</h2>
			<div className="flex">
				{data?.flights ? (
					data.flights.map(flight => {
						return <FlightDisplay key={flight.FlightId} flight={flight} />
					})
				) : (
					<p>No flight data.</p>
				)}
			</div>
			<h2 className="m-3 text-xl">Available Ships</h2>
			<div className="flex flex-wrap">
				{data?.ships ? (
					data.ships.map(ship => {
						return <ShipDisplay key={ship.ShipId} ship={ship} />
					})
				) : (
					<p>No ship data.</p>
				)}
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => {
	return [{ title: 'Flight Data' }]
}

function ShipDisplay({ ship }: { ship: Ship }): JSX.Element {
	let status = 'Stationary'
	if (ship.FlightId) {
		status = 'In Flight'
	}

	return (
		<Card className="m-3 grid w-full flex-col items-center p-5 sm:w-auto sm:grid-cols-[1fr,auto,1fr]">
			<h3 className="text-l col-span-full m-3 font-bold">
				{ship.Registration}
			</h3>
			<div className="col-span-full m-3">
				<p>Status: {status}</p>
				<p>Location: {ship.Location}</p>
			</div>
			<RawShipData ship={ship} />
			<div className='col-start-3'>
				<p>Game information collected on</p>
				<p>
					{dayjs(ship.Timestamp).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs.utc(ship.Timestamp).fromNow()}{' '}
				</p>
			</div>
		</Card>
	)
}

function RawShipData({ ship }: { ship: Ship }): JSX.Element {
	return (
		<Collapsible>
			<CollapsibleTrigger asChild>
				<Button className="m-3">View raw data.</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="min-w-full">
				<p className="font-bold">Identification</p>
				<p>ShipId: {ship.ShipId}</p>
				<p>Registration: {ship.Registration}</p>
				<p>Name: {ship.Name}</p>
				<br />
				<p>Location: {ship.Location}</p>
				<p>Flight ID: {ship.FlightId}</p>
				<br />
				<p className="font-bold">Storage</p>
				<p>StoreId: {ship.StoreId}</p>
				<p>StlFuelStoreId: {ship.StlFuelStoreId}</p>
				<p>FtlFuelStoreId: {ship.FtlFuelStoreId}</p>
				<br />
				<p className="font-bold">Stats</p>
				<p>
					Commissioning Time: {dayjs(ship.CommissioningTimeEpochMs).format()}
				</p>
				<p>Blueprint Natural ID: {ship.BlueprintNaturalId}</p>
				<p>Acceleration: {ship.Acceleration}</p>
				<p>Thrust: {ship.Thrust}</p>
				<p>Mass: {ship.Mass}</p>
				<p>Operating Empty Mass: {ship.OperatingEmptyMass}</p>
				<p>Reactor Power: {ship.ReactorPower}</p>
				<p>Emitter Power: {ship.EmitterPower}</p>
				<p>Volume: {ship.Volume}</p>
				<p>Condition: {ship.Condition}</p>
				<p>Last Repair: {ship.LastRepairEpochMs}</p>
				<p>Stl Fuel Flow Rate: {ship.StlFuelFlowRate}</p>
				<br />
				<p>User Name Submitted: {ship.UserNameSubmitted}</p>
				<p>Timestamp: {ship.Timestamp}</p>
			</CollapsibleContent>
		</Collapsible>
	)
}

function FlightDisplay({ flight }: { flight: Flight }): JSX.Element {
	return (
		<Card
			className="m-3 grid w-full flex-col items-center p-5 sm:w-auto sm:grid-cols-[1fr,auto,1fr]"
			key={flight.FlightId}
		>
			<h3 className="text-l col-span-full m-3 font-bold">{flight.ShipId}</h3>
			<div className="col-span-full m-3 flex flex-col">
				<p className="my-2 font-bold">Progress:</p>
				<div className="flex items-center space-x-3">
					<PlaneTakeoff />
					<Progress key={flight.FlightId} value={calculateProgress(flight)} />
					<PlaneLanding />
				</div>
			</div>
			<Separator className="col-span-full" />
			<div className="m-3">
				<p className="my-2 font-bold">Departure:</p>
				<p>
					{dayjs(flight.DepartureTimeEpochMs).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs(flight.DepartureTimeEpochMs).fromNow()}
				</p>
				<p>
					from <b>{flight.Origin}</b>
				</p>
			</div>
			<Separator
				className="col-start-2 col-end-3 mx-auto hidden sm:block"
				orientation={'vertical'}
			/>
			<Separator
				className="mx-auto block sm:hidden"
				orientation={'horizontal'}
			/>
			<div className="m-3">
				<p className="my-2 font-bold">Arrival:</p>
				<p>
					{dayjs(flight.ArrivalTimeEpochMs).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs(flight.ArrivalTimeEpochMs).fromNow()}
				</p>
				<p>
					to <b>{flight.Destination}</b>
				</p>
			</div>
			<RawFlightData flight={flight} />
			<div className='col-start-3'>
				<p>Game information collected on</p>
				<p>
					{dayjs(flight.Timestamp).format('MMM D YYYY h:mm:ss A')},{' '}
					{dayjs.utc(flight.Timestamp).fromNow()}{' '}
				</p>
			</div>
		</Card>
	)
}

function RawFlightData({ flight }: { flight: Flight }): JSX.Element {
	return (
		<Collapsible>
			<CollapsibleTrigger asChild>
				<Button className="m-3">View raw data.</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="min-w-full">
				<p>Flight ID: {flight.FlightId}</p>
				<p>Ship ID: {flight.ShipId}</p>
				<p>Origin: {flight.Origin}</p>
				<p>Destination: {flight.Destination}</p>
				<p>Departure Time: {dayjs(flight.DepartureTimeEpochMs).format()}</p>
				<p>Arrival Time: {dayjs(flight.ArrivalTimeEpochMs).format()}</p>
				<p>STL Distance: {flight.StlDistance}</p>
				<p>FTL Distance: {flight.FtlDistance}</p>
				<p>Is Aborted: {flight.IsAborted ? 'Yes' : 'No'}</p>
				<p>Current Segment: {flight.CurrentSegmentIndex}</p>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Segment</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Origin</TableHead>
							<TableHead>Destination</TableHead>
							<TableHead>Departure Time</TableHead>
							<TableHead>Arrival Time</TableHead>
							<TableHead>STL Distance</TableHead>
							<TableHead>STL Fuel Consumption</TableHead>
							<TableHead>FTL Distance</TableHead>
							<TableHead>FTL Fuel Consumption</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{flight.Segments.map((segment, index) => {
							return (
								<TableRow key={index}>
									<TableCell
										className={
											dayjs().valueOf() >= segment.DepartureTimeEpochMs &&
											dayjs().valueOf() <= segment.ArrivalTimeEpochMs
												? 'bg-green-200:hover bg-green-200'
												: ''
										}
									>
										{index + 1}
									</TableCell>
									<TableCell>{segment.Type}</TableCell>
									<TableCell>{segment.Origin}</TableCell>
									<TableCell>{segment.Destination}</TableCell>
									<TableCell>
										{dayjs(segment.DepartureTimeEpochMs).format()}
									</TableCell>
									<TableCell>
										{dayjs(segment.ArrivalTimeEpochMs).format()}
									</TableCell>
									<TableCell>{segment.StlDistance}</TableCell>
									<TableCell>{segment.StlFuelConsumption}</TableCell>
									<TableCell>{segment.FtlDistance}</TableCell>
									<TableCell>{segment.FtlFuelConsumption}</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
				<Collapsible>
					<CollapsibleTrigger asChild>
						<Button variant={'outline'}>
							View OriginLines/DestinationLines
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent>
						{flight.Segments.map((segment, index) => {
							return (
								<div key={index}>
									<p>Segment {index + 1} Sub-Lines</p>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Type</TableHead>
												<TableHead>Line ID</TableHead>
												<TableHead>Direction</TableHead>
												<TableHead>Line Natural ID</TableHead>
												<TableHead>Line Name</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{segment.OriginLines.map((line, index) => {
												return (
													<TableRow key={index}>
														<TableCell>{line.Type}</TableCell>
														<TableCell>{line.LineId}</TableCell>
														<TableCell>Origin</TableCell>
														<TableCell>{line.LineNaturalId}</TableCell>
														<TableCell>{line.LineName}</TableCell>
													</TableRow>
												)
											})}
											{segment.DestinationLines.map((line, index) => {
												return (
													<TableRow key={index}>
														<TableCell>{line.Type}</TableCell>
														<TableCell>{line.LineId}</TableCell>
														<TableCell>Destination</TableCell>
														<TableCell>{line.LineNaturalId}</TableCell>
														<TableCell>{line.LineName}</TableCell>
													</TableRow>
												)
											})}
										</TableBody>
									</Table>
								</div>
							)
						})}
					</CollapsibleContent>
				</Collapsible>
			</CollapsibleContent>
		</Collapsible>
	)
}

export function ErrorBoundary() {
	const error = useRouteError()
	const [searchParams] = useSearchParams()
	const usernameURL = searchParams.get('username')

	if (isRouteErrorResponse(error)) {
		switch (error.status) {
			case 401:
				return (
					<div className="items-center justify-center p-20">
						<p>You don't have access to view this users shipping data.</p>
						<p>
							Contact {usernameURL} to provide you access to their FIO flight
							data.
						</p>
						<Button asChild>
							<Link to="/shipping">Go Back</Link>
						</Button>
					</div>
				)
		}

		return (
			<div>
				Something went wrong: {error.status} {error.statusText}
			</div>
		)
	}

	return <GeneralErrorBoundary />
}
