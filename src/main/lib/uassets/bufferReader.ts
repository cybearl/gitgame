/**
 * A position-tracking binary reader for `.uasset` files.
 */
export class UAssetBufferReader {
    private readonly view: DataView
    private cursor = 0
    private isLittleEndian: boolean

    /**
     * @param source Raw buffer or a view over one; the view's `byteOffset`/`byteLength` are respected.
     * @param isLittleEndian Endianness for subsequent multi-byte reads. Defaults to `true`.
     */
    constructor(source: ArrayBuffer | ArrayBufferView, isLittleEndian = true) {
        if (source instanceof ArrayBuffer) {
            this.view = new DataView(source)
        } else {
            this.view = new DataView(source.buffer, source.byteOffset, source.byteLength)
        }

        this.isLittleEndian = isLittleEndian
    }

    /**
     * Current byte offset from the start of the buffer.
     * @returns The current byte offset.
     */
    tell(): number {
        return this.cursor
    }

    /**
     * Move the cursor to an absolute byte position.
     */
    seek(position: number): void {
        this.cursor = position
    }

    /**
     * Advance the cursor by `byteCount` bytes without reading.
     */
    skip(byteCount: number): void {
        this.cursor += byteCount
    }

    /**
     * Bytes left between the cursor and the end of the buffer.
     * @returns The number of bytes remaining.
     */
    remaining(): number {
        return this.view.byteLength - this.cursor
    }

    /**
     * True when the cursor has reached or passed the end of the buffer.
     * @returns Whether the reader is at end-of-buffer.
     */
    atEnd(): boolean {
        return this.cursor >= this.view.byteLength
    }

    /**
     * Toggle endianness for subsequent multi-byte reads.
     */
    setLittleEndian(isLittleEndian: boolean): void {
        this.isLittleEndian = isLittleEndian
    }

    /**
     * Read one unsigned byte.
     * @returns The unsigned byte value.
     */
    uint8(): number {
        const value = this.view.getUint8(this.cursor)
        this.cursor += 1
        return value
    }

    /**
     * Read one signed byte.
     * @returns The signed byte value.
     */
    int8(): number {
        const value = this.view.getInt8(this.cursor)
        this.cursor += 1
        return value
    }

    /**
     * Read a 16-bit unsigned integer at the current endianness.
     * @returns The 16-bit unsigned integer.
     */
    uint16(): number {
        const value = this.view.getUint16(this.cursor, this.isLittleEndian)
        this.cursor += 2
        return value
    }

    /**
     * Read a 16-bit signed integer at the current endianness.
     * @returns The 16-bit signed integer.
     */
    int16(): number {
        const value = this.view.getInt16(this.cursor, this.isLittleEndian)
        this.cursor += 2
        return value
    }

    /**
     * Read a 32-bit unsigned integer at the current endianness.
     * @returns The 32-bit unsigned integer.
     */
    uint32(): number {
        const value = this.view.getUint32(this.cursor, this.isLittleEndian)
        this.cursor += 4
        return value
    }

    /**
     * Read a 32-bit signed integer at the current endianness.
     * @returns The 32-bit signed integer.
     */
    int32(): number {
        const value = this.view.getInt32(this.cursor, this.isLittleEndian)
        this.cursor += 4
        return value
    }

    /**
     * Read a 64-bit unsigned integer as `bigint` at the current endianness.
     * @returns The 64-bit unsigned integer as `bigint`.
     */
    uint64(): bigint {
        const value = this.view.getBigUint64(this.cursor, this.isLittleEndian)
        this.cursor += 8
        return value
    }

    /**
     * Read a 64-bit signed integer as `bigint` at the current endianness.
     * @returns The 64-bit signed integer as `bigint`.
     */
    int64(): bigint {
        const value = this.view.getBigInt64(this.cursor, this.isLittleEndian)
        this.cursor += 8
        return value
    }

    /**
     * Read a 32-bit IEEE-754 float at the current endianness.
     * @returns The 32-bit float value.
     */
    float32(): number {
        const value = this.view.getFloat32(this.cursor, this.isLittleEndian)
        this.cursor += 4
        return value
    }

    /**
     * Read a 64-bit IEEE-754 float at the current endianness.
     * @returns The 64-bit float value.
     */
    float64(): number {
        const value = this.view.getFloat64(this.cursor, this.isLittleEndian)
        this.cursor += 8
        return value
    }

    /**
     * Read a UE boolean, serialized as int32 (0 or 1).
     * @returns The decoded boolean value.
     */
    bool32(): boolean {
        return this.int32() !== 0
    }

    /**
     * Read `byteCount` bytes into a fresh (non-aliasing) `Uint8Array`.
     * @returns A fresh `Uint8Array` containing the read bytes.
     */
    bytes(byteCount: number): Uint8Array {
        const start = this.view.byteOffset + this.cursor
        const slice = new Uint8Array(this.view.buffer.slice(start, start + byteCount))
        this.cursor += byteCount
        return slice
    }

    /**
     * Read a UE `FString`: int32 length prefix, ANSI when positive or UTF-16LE when negative.
     * The stored length includes the null terminator; the returned string does not.
     * @returns The decoded string, or the empty string when the length prefix is zero.
     */
    fstring(): string {
        const length = this.int32()
        if (length === 0) return ""

        if (length > 0) {
            const chars = this.bytes(length)
            return new TextDecoder("ascii").decode(chars.subarray(0, length - 1))
        }

        const charCount = -length
        const chars = this.bytes(charCount * 2)
        return new TextDecoder("utf-16le").decode(chars.subarray(0, (charCount - 1) * 2))
    }

    /**
     * Read a UE `FGuid` (16 bytes as four `uint32`) as its canonical 32-char upper-hex string.
     * @returns The GUID formatted as 32 upper-case hex characters.
     */
    fguid(): string {
        const a = this.uint32().toString(16).padStart(8, "0")
        const b = this.uint32().toString(16).padStart(8, "0")
        const c = this.uint32().toString(16).padStart(8, "0")
        const d = this.uint32().toString(16).padStart(8, "0")
        return (a + b + c + d).toUpperCase()
    }
}
