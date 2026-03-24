export function ellipsisAddress(
	address: unknown,
	length = 4,
): string | undefined {
	if (typeof address !== 'string') return undefined;

	if (address.startsWith('0x')) {
		return address.replace(
			new RegExp(`^(0x.{${length}}).*(.{${length}})$`),
			'$1..$2',
		);
	}

	return address.replace(
		new RegExp(`^(.{${length}}).*(.{${length}})$`),
		'$1..$2',
	);
}
