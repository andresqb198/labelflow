import { useState } from "react";
import {
  Button,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorModeValue as mode,
  Badge,
} from "@chakra-ui/react";
import * as React from "react";
import { User } from "./user";
import { RoleSelection } from "./role-selection";
import { ChangeMembershipRole, RemoveMembership, Membership } from "./types";
import { DeleteMembershipModal } from "./delete-membership-modal";
import { DeleteMembershipErrorModal } from "./delete-memebership-error-modal";

const badgeEnum: Record<string, string> = {
  active: "green",
  reviewing: "orange",
  declined: "red",
};

const columns = [
  {
    Header: "Member",
    accessor: "user",
    Cell: function MemberCell(data: any) {
      return <User data={data} />;
    },
  },
  {
    Header: "Role",
    accessor: "role",
    Cell: function RoleSelectionCell(
      role: any,
      id: string,
      changeMembershipRole: any
    ) {
      return (
        <RoleSelection
          role={role}
          changeMembershipRole={changeMembershipRole}
          id={id}
        />
      );
    },
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: function StatusCell(data: any) {
      const status = data ?? "active";
      return (
        <Badge fontSize="xs" colorScheme={badgeEnum[status]}>
          {status}
        </Badge>
      );
    },
  },
];

export const TableContent = ({
  memberships,
  changeMembershipRole,
  removeMembership,
  searchText,
}: {
  memberships: Membership[];
  changeMembershipRole: ChangeMembershipRole;
  removeMembership: RemoveMembership;
  searchText: string;
}) => {
  const [membershipToDelete, setMembershipToDelete] =
    useState<null | Membership>(null);

  const filteredMemberships = memberships.filter(
    (membership) =>
      membership.user.email
        ?.toLowerCase()
        ?.includes(searchText.toLowerCase()) ||
      membership.user.name?.toLowerCase()?.includes(searchText.toLowerCase()) ||
      membership.user.id?.toLowerCase()?.includes(searchText.toLowerCase())
  );
  return (
    <>
      <DeleteMembershipModal
        isOpen={membershipToDelete != null && memberships.length > 1}
        membership={membershipToDelete}
        onClose={() => setMembershipToDelete(null)}
        deleteMembership={removeMembership}
      />
      <DeleteMembershipErrorModal
        isOpen={membershipToDelete != null && memberships.length <= 1}
        membership={membershipToDelete}
        onClose={() => setMembershipToDelete(null)}
      />
      <Table my="8" borderWidth="1px" fontSize="sm">
        <Thead bg={mode("gray.50", "gray.800")}>
          <Tr>
            {columns.map((column, index) => (
              <Th whiteSpace="nowrap" scope="col" key={index}>
                {column.Header}
              </Th>
            ))}
            <Th />
          </Tr>
        </Thead>
        <Tbody bgColor="#FFFFFF">
          {filteredMemberships.map((row, membershipIndex) => (
            <Tr key={membershipIndex}>
              {columns.map((column, index) => {
                const cell = row[column.accessor as keyof typeof row];
                const element =
                  column.Cell?.(cell, row.id, changeMembershipRole) ?? cell;
                return (
                  <Td whiteSpace="nowrap" key={index}>
                    {element}
                  </Td>
                );
              })}
              <Td textAlign="right">
                <Button
                  variant="link"
                  colorScheme="blue"
                  onClick={() => setMembershipToDelete(row)}
                >
                  Remove
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};
