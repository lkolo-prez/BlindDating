import {
	TableContainer,
	Table,
	TableCaption,
	Thead,
	Tr,
	Th,
	Tbody,
	Td,
	Box,
	Text,
    Input,
    InputGroup,
    InputRightAddon,
    Button,
    Link,
} from "@chakra-ui/react";
import * as React from "react";
import {
	Paginator,
	Container,
	Previous,
	Next,
	PageGroup,
	usePaginator,
} from "chakra-paginator";
import { GetServerSidePropsExpress } from "../../types/next";
import { User, UserDocument } from "../../models/User";
import mongoose from "mongoose";
import { useEffect, useState } from "react";
import Router from "next/router";


type Query = mongoose.PaginateResult<
		UserDocument & {
			_id: mongoose.Types.ObjectId;
		}
	>;

export interface IUsersProps {
	query: string
    searchQuery: string
}


export const getServerSideProps: GetServerSidePropsExpress<
	IUsersProps
> = async ({ req, res, query }) => {
	if (!req.user) return res.redirect("/");
	if (!req.user.isAdmin) return res.redirect("/");
    
    const sq = String(query.searchQuery)
    
    const options = {
        page: Number(query.page) || 1,
        limit: Number(query.limit || 20),
    }
    
    const q = {
			$or: [
				{ discordID: { $regex: sq } },
				{ "profileInfo.name": { $regex: sq } },
				{ "profileInfo.surname": { $regex: sq } },
				{ "profileInfo.school": { $regex: sq } },
			],
		};

    const result = query.searchQuery
				? await User.paginate(
                    q,
                    options
				  )
				: await User.paginate({}, options);

	return {
		props: {
			query: JSON.stringify(result),
            searchQuery: (req.query.searchQuery || "") as string,
		},
	};
};

export default function Users(props: IUsersProps) {
    const [sQuery, setSQuery] = useState(props.searchQuery);
    const query: Query = JSON.parse(props.query)
	const pagesQuantity = query.totalPages;
	let { currentPage, setCurrentPage } = usePaginator({
		initialState: { currentPage: query.page },
	});
    const searchMe = () => {
        Router.push({
			pathname: "/admin/users",
			query: sQuery ? { 
                page: currentPage, 
                searchQuery: encodeURI(sQuery),
            }
		: { 
                page: currentPage, 
            }}
		);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(searchMe, [currentPage])
	return (
		<Box width="100%">
			<Box h="40px"></Box>

			<Text fontSize="4xl" fontWeight="bold" m={6}>
				Użytkownicy
			</Text>
			{/* @ts-expect-error */}
			<Paginator
				pagesQuantity={pagesQuantity}
				currentPage={currentPage}
				onPageChange={setCurrentPage}
			>
				<InputGroup>
					<Input
						type="tel"
						value={sQuery}
						onChange={(e) => setSQuery(e.target.value)}
						placeholder="Wyszukaj"
					/>
					<InputRightAddon>
						<Button
							onClick={() => {
								currentPage = 1;
								searchMe();
							}}
							variant="ghost"
						>
							Szukaj
						</Button>
					</InputRightAddon>
				</InputGroup>
				<TableContainer>
					<Table variant="simple">
						<TableCaption>Użytkownicy</TableCaption>
						<Thead>
							<Tr>
								<Th w="1px">ID</Th>
								<Th>Imię i Nazwisko</Th>
								<Th>Wiek</Th>
								<Th>Szkoła</Th>
								<Th>Zarządzaj</Th>
							</Tr>
						</Thead>
						<Tbody>
							{query.docs.map((usr, idx) => {
								return (
									<Tr key={idx}>
										<Td>{usr.discordID}</Td>
										<Td>
											{usr.profileInfo.name} {usr.profileInfo.surname}
										</Td>
										<Td>{usr.profileInfo.age}</Td>
										<Td>{usr.profileInfo.school}</Td>
										<Td>
											<Link href={`/admin/user/${usr._id}`}>
												<Button>Zarządzaj</Button>
											</Link>
										</Td>
									</Tr>
								);
							})}
						</Tbody>
						<Tbody></Tbody>
					</Table>
				</TableContainer>
				<Container align="center" justify="space-between" w="full" p={4}>
					<Previous>Previous</Previous>
					<Box maxW="50vw" overflowX="scroll">
						<PageGroup isInline align="center" />
					</Box>
					<Next>Next</Next>
				</Container>
			</Paginator>
		</Box>
	);
}
